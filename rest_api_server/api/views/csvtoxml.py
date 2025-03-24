from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

import grpc
import api.grpc.server_services_pb2 as server_services_pb2
import api.grpc.server_services_pb2_grpc as server_services_pb2_grpc
import os
from rest_api_server.settings import GRPC_PORT, GRPC_HOST

class csvtoxml(APIView):
    def post(self, request):


        file_name = request.data.get('file_name')

        channel = grpc.insecure_channel(f'{GRPC_HOST}:{GRPC_PORT}')
        stub = server_services_pb2_grpc.SendFileServiceStub(channel)

        grpc_request = server_services_pb2.CsvToXmlRequest(
            file_name=file_name
        )

        try:
            response = stub.CsvToXml(grpc_request)
            return Response({
                "file_name": file_name,
                "message": response.message,
            }, status=status.HTTP_201_CREATED)
        except grpc.RpcError as e:
            return Response({"error": f"gRPC call failed: {e.details()}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


