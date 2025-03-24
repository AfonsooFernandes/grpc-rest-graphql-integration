import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const formData      = await req.formData()
    const body          = Object.fromEntries(formData)
    const file          = (body.file as Blob) || null
    const schema_file      = (body.dtd_file as Blob) || null

    if(!file || !schema_file){
        return NextResponse.json({status: 500, message: 'Ficheiros não enviados!'}, { status: 500  }) 
    }

    const formdata      = new FormData()

    formdata.append("file", file)

    const requestOptions = {
        method: "POST",
        body: formdata
    }

    const Schema_formdata = new FormData()

    Schema_formdata.append("file", schema_file)

    const Schema_requestOptions = {
        method: "POST",
        body: Schema_formdata
    }

    try{
        const promise = await fetch(`${process.env.REST_API_BASE_URL}/api/upload-file/by-chunks`, requestOptions)
        const schema_promise = await fetch(`${process.env.REST_API_BASE_URL}/api/upload-file/by-chunks`, Schema_requestOptions)

        if(!promise.ok){
            return NextResponse.json({status: promise.status, message: promise.statusText}, { status: promise.status }) 
        }

        if(!schema_promise.ok){
            return NextResponse.json({status: schema_promise.status, message: schema_promise.statusText}, { status: schema_promise.status }) 
        }

        
        return NextResponse.json(await promise.json()), NextResponse.json(await schema_promise.json()) 
    }catch(e){
        return NextResponse.json({status: 500, message: e}, { status: 500  }) 
    }
}