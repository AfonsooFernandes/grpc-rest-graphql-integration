import pika
import os
import logging
import time
import pandas as pd
import pg8000
from io import StringIO

RABBITMQ_HOST = os.getenv("RABBITMQ_HOST", "localhost")
RABBITMQ_PORT = os.getenv("RABBITMQ_PORT", "5672")
RABBITMQ_USER = os.getenv("RABBITMQ_USER", "user")
RABBITMQ_PW = os.getenv("RABBITMQ_PW", "password")
QUEUE_NAME = 'csv_chunks'
DBHOST = os.getenv('DBHOST', 'localhost')
DBUSERNAME = os.getenv('DBUSERNAME', 'myuser')
DBPASSWORD = os.getenv('DBPASSWORD', 'mypassword')
DBNAME = os.getenv('DBNAME', 'mydatabase')
DBPORT = os.getenv('DBPORT', '5432')

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger()

reassembled_data = []

def connect_to_db():
    try:
        connection = pg8000.connect(host=DBHOST, user=DBUSERNAME, password=DBPASSWORD, database=DBNAME, port=int(DBPORT))
        logger.info("Conectado á base de dados com sucesso.")
        return connection
    except Exception as e:
        logger.error(f"Erro ao conectar á base de dados: {e}")
        return None

def create_tables():
    conn = connect_to_db()
    if conn:
        cursor = conn.cursor()
        try:
            cursor.execute("""
                DROP TABLE IF EXISTS orders CASCADE;
                DROP TABLE IF EXISTS customers CASCADE;
                DROP TABLE IF EXISTS products CASCADE;

                CREATE TABLE customers (
                    Customer_ID VARCHAR(15) PRIMARY KEY,
                    Customer_Name VARCHAR(50),
                    Segment VARCHAR(50),
                    Country VARCHAR(50)
                );

                CREATE TABLE orders (
                    Order_ID VARCHAR(20) PRIMARY KEY,
                    Customer_ID VARCHAR(15) REFERENCES customers(Customer_ID),
                    Order_Date DATE,
                    Quantity INT,
                    Sales DECIMAL(10, 2),
                    Profit DECIMAL(10, 2)
                );

                CREATE TABLE products (       
                    Product_ID SERIAL PRIMARY KEY,
                    Category VARCHAR(50),
                    Sub_Category VARCHAR(50),
                    Product_Name TEXT,
                    Latitude DECIMAL(9,6),
                    Longitude DECIMAL(9,6),
                    Order_ID VARCHAR(20) REFERENCES orders(Order_ID)
                );
            """)
            conn.commit()
            logger.info("Tabelas criadas com sucesso.")
        except Exception as e:
            logger.error(f"Erro ao criar tabelas: {e}")
        finally:
            cursor.close()
            conn.close()

def validate_and_clean_data(df):
    df.columns = df.columns.str.replace(' ', '_').str.replace('-', '_').str.lower()
    column_map = {
        'row_id': 'Row_ID',
        'order_id': 'Order_ID',
        'order_date': 'Order_Date',
        'ship_date': 'Ship_Date',
        'ship_mode': 'Ship_Mode',
        'customer_id': 'Customer_ID',
        'customer_name': 'Customer_Name',
        'segment': 'Segment',
        'country': 'Country',
        'city': 'City',
        'state': 'State',
        'postal_code': 'Postal_Code',
        'region': 'Region',
        'retail_sales_people': 'Retail_Sales_People',
        'product_id': 'Product_ID',
        'category': 'Category',
        'sub_category': 'Sub_Category',
        'product_name': 'Product_Name',
        'returned': 'Returned',
        'sales': 'Sales',
        'quantity': 'Quantity',
        'discount': 'Discount',
        'profit': 'Profit',
        'latitude': 'Latitude',
        'longitude': 'Longitude'
    }
    df.rename(columns=column_map, inplace=True)

    numeric_fields = ['Latitude', 'Longitude', 'Sales', 'Profit', 'Quantity', 'Discount']
    for field in numeric_fields:
        if df[field].dtype == object:
            df[field] = df[field].str.replace(';', '').str.strip().replace('', '0').astype(float)
        df[field] = pd.to_numeric(df[field], errors='coerce').fillna(0)
    
    df['Order_Date'] = pd.to_datetime(df['Order_Date'], errors='coerce').fillna(pd.Timestamp("1970-01-01"))
    df['Quantity'] = df['Quantity'].astype(int)

    df = df[df['Order_ID'].notnull()]
    
    return df

def insert_customers(df):
    conn = connect_to_db()
    if conn:
        cursor = conn.cursor()
        try:
            for _, row in df.iterrows():
                cursor.execute("""
                    INSERT INTO customers (Customer_ID, Customer_Name, Segment, Country)
                    VALUES (%s, %s, %s, %s)
                    ON CONFLICT (Customer_ID) DO NOTHING
                """, (row['Customer_ID'], row['Customer_Name'], row['Segment'], row['Country']))
            conn.commit()
            logger.info("Clientes inseridos com sucesso.")
        except Exception as e:
            logger.error(f"Erro ao inserir clientes: {e}")
        finally:
            cursor.close()
            conn.close()

def insert_orders(df):
    conn = connect_to_db()
    if conn:
        cursor = conn.cursor()
        try:
            for _, row in df.iterrows():
                cursor.execute("""
                    INSERT INTO orders (Order_ID, Customer_ID, Order_Date, Quantity, Sales, Profit)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    ON CONFLICT (Order_ID) DO NOTHING
                """, (row['Order_ID'], row['Customer_ID'], row['Order_Date'], row['Quantity'], row['Sales'], row['Profit']))
            conn.commit()
            logger.info("Pedidos inseridos com sucesso.")
        except Exception as e:
            logger.error(f"Erro ao inserir pedidos: {e}")
        finally:
            cursor.close()
            conn.close()

def insert_products(df):
    conn = connect_to_db()
    if conn:
        cursor = conn.cursor()
        try:
            for _, row in df.iterrows():
                cursor.execute("""
                    SELECT 1 FROM orders WHERE Order_ID = %s
                """, (row['Order_ID'],))
                order_exists = cursor.fetchone()
                if not order_exists:
                    logger.warning(f"Order_ID {row['Order_ID']} não encontrado. Produto será ignorado.")
                    continue

                cursor.execute("""
                    INSERT INTO products (Category, Sub_Category, Product_Name, Latitude, Longitude, Order_ID)
                    VALUES (%s, %s, %s, %s, %s, %s)
                """, (
                    row['Category'], 
                    row['Sub_Category'], 
                    row['Product_Name'], 
                    row['Latitude'], 
                    row['Longitude'], 
                    row['Order_ID']
                ))
            conn.commit()
            logger.info("Produtos inseridos com sucesso.")
        except Exception as e:
            logger.error(f"Erro ao inserir produtos: {e}")
        finally:
            cursor.close()
            conn.close()

def process_message(ch, method, properties, body):
    global reassembled_data
    if not body:
        logger.error("Mensagem inválida recebida")
        return
    str_stream = body.decode('utf-8')
    if str_stream == "__EOF__":
        logger.info("Marcador EOF recebido. Processando CSV...")
        if reassembled_data:
            csv_data = pd.read_csv(StringIO(''.join(reassembled_data)))
            csv_data = validate_and_clean_data(csv_data)
            if not csv_data.empty:
                try:
                    insert_customers(csv_data)

                    insert_orders(csv_data)

                    insert_products(csv_data)
                except Exception as e:
                    logger.error(f"Erro ao processar dados: {e}")
            reassembled_data.clear()
        else:
            logger.info("Nenhum dado para processar.")
    else:
        reassembled_data.append(str_stream)

def connect_to_rabbitmq():
    credentials = pika.PlainCredentials(RABBITMQ_USER, RABBITMQ_PW)
    while True:
        try:
            connection = pika.BlockingConnection(pika.ConnectionParameters(host=RABBITMQ_HOST, port=RABBITMQ_PORT, credentials=credentials))
            channel = connection.channel()
            channel.queue_declare(queue=QUEUE_NAME)
            channel.basic_consume(queue=QUEUE_NAME, on_message_callback=process_message, auto_ack=True)
            logger.info("Conectado ao RabbitMQ. Aguardando mensagens...")
            channel.start_consuming()
        except Exception as e:
            logger.error(f"Erro de conexão com RabbitMQ: {e}. Tentando novamente em 5 segundos...")
            time.sleep(5)

if __name__ == "__main__":
    create_tables()
    connect_to_rabbitmq()