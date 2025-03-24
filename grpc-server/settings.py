import os

#Server Configuration
#Default value '50051'

GRPC_SERVER_PORT = os.getenv("GRPC_SERVER_PORT", '50051')
MAX_WORKERS = int(os.getenv("MAX_WORKERS", '10'))

#Media Files

MEDIA_PATH = os.getenv('MEDIA_PATH', f'{os.getcwd()}/app/csv')

# DB settings
DBNAME = os.getenv('DBNAME', 'mydatabase')
DBUSERNAME = os.getenv('DBUSERNAME', 'postgres')
DBPASSWORD = os.getenv('DBPASSWORD', '@Pocas2004')
DBHOST = os.getenv('DBHOST', 'localhost')
DBPORT = os.getenv('DBPORT', '5432')