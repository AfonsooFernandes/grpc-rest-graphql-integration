export interface Product{
    productId: number
    productName: string
    orderId: string
    latitude: number
    longitude: number
}

export interface Products{
    products: Product[]
}

export interface GraphQlProducts{
    data: Products
}