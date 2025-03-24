from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

import grpc
import api.grpc.server_services_pb2 as server_services_pb2
import api.grpc.server_services_pb2_grpc as server_services_pb2_grpc
import os
from rest_api_server.settings import GRPC_PORT, GRPC_HOST


class FilterXml(APIView):
    def post(self, request):
        # Extrair os dados da requisição
        file_name = request.data.get('file_name')
        city_name = request.data.get('city_name')

        # Conectar ao serviço gRPC
        channel = grpc.insecure_channel(f'{GRPC_HOST}:{GRPC_PORT}')
        stub = server_services_pb2_grpc.SendFileServiceStub(channel)

        # Preparar a requisição gRPC
        grpc_request = server_services_pb2.FilterXmlRequest(
            file_name=file_name,
            city_name=city_name
        )

        # Enviar os dados para o serviço gRPC e receber a resposta
        try:
            response = stub.FilterXml(grpc_request)
            if response.success:
                # Tratar e responder com o XML resultante
                return Response({
                    "success": True,
                    "xml_data": response.xml_data
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    "success": False,
                    "message": response.message
                }, status=status.HTTP_204_NO_CONTENT)
        except grpc.RpcError as e:
            return Response({"error": f"gRPC call failed: {e.details()}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)