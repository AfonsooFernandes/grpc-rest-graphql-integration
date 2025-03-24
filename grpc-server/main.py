from concurrent import futures
from settings import GRPC_SERVER_PORT, MAX_WORKERS, MEDIA_PATH, DBNAME, DBUSERNAME, DBPASSWORD, DBHOST, DBPORT
import os
import server_services_pb2_grpc
import server_services_pb2
import grpc
import logging
import pg8000
import pika
import pandas as pd
import xml.etree.ElementTree as ET
import lxml.etree as ET
from lxml import etree

LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
logging.basicConfig(level=logging.INFO, format=LOG_FORMAT)
logger = logging.getLogger("FileService")

class SendFileService(server_services_pb2_grpc.SendFileServiceServicer):
    def __init__(self, *args, **kwargs):
        pass

    def SendFile(self, request, context):
        os.makedirs(MEDIA_PATH, exist_ok=True)
        file_path = os.path.join(MEDIA_PATH, request.file_name + request.file_mime)

        ficheiro_em_bytes = request.file
        with open(file_path, 'wb') as f:
            f.write(ficheiro_em_bytes)

    def SendFileChunks(self, request_iterator, context):
        try:
            rabbit_connection = pika.BlockingConnection(
                pika.ConnectionParameters(
                    host=os.getenv("RABBITMQ_HOST", "localhost"),
                    port=int(os.getenv("RABBITMQ_PORT", "5672")),
                    credentials=pika.PlainCredentials(
                        os.getenv("RABBITMQ_USER", "user"),
                        os.getenv("RABBITMQ_PW", "password")
                    )
                )
            )
            rabbit_channel = rabbit_connection.channel()
            rabbit_channel.queue_declare(queue='csv_chunks')

            os.makedirs(MEDIA_PATH, exist_ok=True)
            file_name = None
            file_chunks = []

            for chunk in request_iterator:
                if not file_name:
                    file_name = chunk.file_name

                file_chunks.append(chunk.data)
                rabbit_channel.basic_publish(
                    exchange='',
                    routing_key='csv_chunks',
                    body=chunk.data
                )

            rabbit_channel.basic_publish(
                exchange='',
                routing_key='csv_chunks',
                body="__EOF__"
            )

            file_content = b"".join(file_chunks)
            file_path = os.path.join(MEDIA_PATH, file_name)
            with open(file_path, 'wb') as f:
                f.write(file_content)

            return server_services_pb2.SendFileChunksResponse(success=True, message='File imported')
        except Exception as e:
            logger.error(f"Error: {str(e)}", exc_info=True)
            return server_services_pb2.SendFileChunksResponse(success=False, message=str(e))
        
    def CsvToXml(self, request, context):
        csv_file_path = os.path.join(MEDIA_PATH, request.file_name + ".csv")
        xml_file_path = csv_file_path.replace(".csv", ".xml")
        logger.info(f"Writing XML to: {xml_file_path}")
        df = pd.read_csv(csv_file_path)
        root = etree.Element("Orders")
        for _, row in df.iterrows():
            order = etree.SubElement(root, "Order")
            for col_name, value in row.items():
                element = etree.SubElement(order, col_name.replace(' ', '_'))
                element.text = str(value)  
        tree = etree.ElementTree(root)
        tree.write(xml_file_path, encoding='utf-8', xml_declaration=True)
        xml = etree.parse(xml_file_path)
        input_schema = etree.parse(os.path.join(MEDIA_PATH, f"{request.file_name}_schema.xsd"))
        input_schema_doc = etree.XMLSchema(input_schema)
        if input_schema_doc.validate(xml):
            return server_services_pb2.CsvToXmlResponse(success=True, message='Csv converted to Xml successfully and validated by schema')
        else:
            return server_services_pb2.CsvToXmlResponse(success=False, message='Csv not converted to Xml or not validated by schema')

    def FilterXml(self, request, context):
        try:
            file_path = os.path.join(MEDIA_PATH, f"{request.file_name}.xml")
            if not os.path.exists(file_path):
                return server_services_pb2.FilterXmlResponse(success=False, message="XML file not found.")
        
            xml_doc = etree.parse(file_path)

            entries = xml_doc.xpath(f"//Order[City/text()='{request.city_name}']")

            if entries:
                response_root = etree.Element("ResponseData")
                for entry in entries:
                    entry_element = etree.SubElement(response_root, "Order")
                    for child in entry:
                        child_element = etree.SubElement(entry_element, child.tag)
                        child_element.text = child.text

                xml_string = etree.tostring(response_root, pretty_print=True, encoding='UTF-8', xml_declaration=True).decode('UTF-8')
                return server_services_pb2.FilterXmlResponse(success=True, xml_data=xml_string)
            else:
                return server_services_pb2.FilterXmlResponse(success=False, message="No entries found for the specified city.")
        except etree.XMLSyntaxError as e:
            logger.error("XML Syntax Error", exc_info=True)
            return server_services_pb2.FilterXmlResponse(success=False, message="Malformed XML file.")
        except Exception as e:
            logger.error(f"Unexpected error: {str(e)}", exc_info=True)
            return server_services_pb2.FilterXmlResponse(success=False, message=str(e))
    
def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=MAX_WORKERS))
    server_services_pb2_grpc.add_SendFileServiceServicer_to_server(SendFileService(), server)
    server.add_insecure_port(f'[::]:{GRPC_SERVER_PORT}')
    server.start()
    server.wait_for_termination()

if __name__ == "__main__":
    serve()