import LeafleatMap from "./components/MainMap";
import Sidebar from "./components/MainSideBar";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { GraphQlProducts } from "./interface";

const getMapaData = async (search: string): Promise<GraphQlProducts> => {
  "use server";

  const headers = {
    "Content-Type": "application/json",
  };

  const options = {
    method: "POST",
    headers,
    body: JSON.stringify({
      search: search.trim(),
    }),
  };

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_URL}/api/products`,
      options
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Resposta do servidor:", errorText);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: GraphQlProducts = await response.json();
    if (!data?.data?.products) {
      return { data: { products: [] } };
    }

    return data;
  } catch (error) {
    console.error("Falha ao dar fetch nos dados do mapa:", error);
    return { data: { products: [] } };
  }
};

const updatePoint = async (productId: number, latitude: number, longitude: number) => {
  "use server";

  const headers = {
    "Content-Type": "application/json",
  };

  const body = JSON.stringify({
    latitude,
    longitude,
  });

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_URL}/api/products/${productId}`,
      {
        method: "PUT",
        headers,
        body,
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return { status: response.status, ...(await response.json()) };
  } catch (error) {
    console.error("Falha ao atualizar ponto:", error);
    return { status: 500, message: "Internal Server Error" };
  }
};

export default async function Home({ searchParams }: { searchParams: any }) {
  const params: any = await searchParams;

  const search: string = params?.search?.trim() || ""; 

  const mapa_data: GraphQlProducts = await getMapaData(search);

  return (
    <div
      className="h-[100vh] flex flex-col"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
      }}
    >
      <nav className="w-[250px] h-full fixed left-0">
        <Sidebar searchValue={search} />
      </nav>
      <main
        className="flex-grow"
        style={{
          marginLeft: 250,
          flexGrow: 1,
        }}
      >
        <LeafleatMap
          cities={mapa_data.data?.products || []}
          updatePoint={updatePoint}
        />
      </main>
      <footer
        style={{
          backgroundColor: "#f8f9fa",
          padding: "5px 10px",
          textAlign: "center",
          color: "#007bff",
        }}
      >
        <p>© Integração de Sistemas 2024/2025 - Afonso Fernandes (29344)</p>
      </footer>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}
