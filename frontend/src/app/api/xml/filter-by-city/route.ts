import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const requestBody = await req.json();
        const { city_name } = requestBody;

        if (!city_name) {
            return NextResponse.json(
                { status: 400, message: "Falta city_name" },
                { status: 400 }
            );
        }

        const requestOptions = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ file_name: "input", city_name }),
        };

        const apiResponse = await fetch(
            `${process.env.REST_API_BASE_URL}/api/filterxml/`,
            requestOptions
        );

        if (!apiResponse.ok) {
            console.error(`Error: ${apiResponse.statusText}`);
            return NextResponse.json(
                {
                    status: apiResponse.status,
                    message: apiResponse.statusText || "Falha no fetch de dados da API externa",
                }, 
                { status: apiResponse.status }
            );
        }

        const responseData = await apiResponse.text();

        return new Response(responseData, {
            headers: { "Content-Type": "application/xml" },
        });
    } catch (error) {
        console.error("Fetch error:", error);
        return NextResponse.json(
            { status: 500, message: "Internal Server Error" },
            { status: 500 }
        );
    }
}