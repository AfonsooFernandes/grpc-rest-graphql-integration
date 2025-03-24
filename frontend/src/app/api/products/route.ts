import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const isDevelopment = process.env.NODE_ENV === 'development';

    try {
        const request_body = await req.json();
        const product_name = request_body?.search?.trim() || '';

        const query = `
            query Products {
                products${product_name ? `(name: "${product_name}")` : ``} {
                    productId
                    productName
                    orderId
                    latitude
                    longitude
                }
            }
        `;

        const headers = {
            'Content-Type': 'application/json',
        };

        const requestBody = {
            query,
        };

        const options = {
            method: 'POST',
            headers,
            body: JSON.stringify(requestBody),
        };

        if (isDevelopment && product_name) {
            console.log(`GraphQL query para produto: "${product_name}"`);
        } else if (isDevelopment) {
            console.log("GraphQL query para todos os produtos.");
        }

        const response = await fetch(`${process.env.GRAPHQL_API_BASE_URL}/graphql`, options);

        if (!response.ok) {
            const errorText = await response.text();
            if (isDevelopment) {
                console.error("GraphQL API error:", errorText);
            }
            return NextResponse.json(
                { status: response.status, message: errorText },
                { status: response.status }
            );
        }

        const data = await response.json();

        if (isDevelopment) {
            console.log("GraphQL query com sucesso.");
        }

        return NextResponse.json(data);
    } catch (error) {
        if (isDevelopment) {
            console.error("Server error:", error);
        }
        return NextResponse.json(
            { status: 500, message: "Internal server error" },
            { status: 500 }
        );
    }
}