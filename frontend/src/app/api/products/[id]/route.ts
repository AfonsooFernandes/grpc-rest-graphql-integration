import { NextRequest, NextResponse } from "next/server";

export async function PUT(req: NextRequest) {
  const request_body = await req.json();
  const id = req.nextUrl.pathname.split("/")[3];

  const headers = {
    'Content-Type': 'application/json',
  };

  const requestBody = {
    query: `mutation UpdateProductLocation {
      updateProductLocation(productId: ${id}, latitude: ${request_body.latitude}, longitude: ${request_body.longitude}) {
          product {
              productId
              latitude
              longitude
          }
      }
    }`,
  };

  const options = {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(requestBody),
  };

  try {
    const response = await fetch(`${process.env.GRAPHQL_API_BASE_URL}/graphql`, options);

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { message: 'Erro na resposta do GraphQL', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}