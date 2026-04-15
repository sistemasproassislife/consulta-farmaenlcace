export async function POST(req) {
  try {
    const { cedula } = await req.json();

    const url = `${process.env.APEX_API_URL}?nrodoc=${encodeURIComponent(cedula)}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    const data = await response.json();

    return Response.json(data);
  } catch (error) {
    return Response.json(
      {
        error: "Error al consultar el servicio",
        detalle: error.message,
      },
      { status: 500 }
    );
  }
}
