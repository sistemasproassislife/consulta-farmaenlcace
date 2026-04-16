"use client";
import { useState } from "react";

export default function Home() {
  const [cedula, setCedula] = useState("");
  const [respuesta, setRespuesta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorConexion, setErrorConexion] = useState("");

  const consultar = async () => {
    setLoading(true);
    setErrorConexion("");
    setRespuesta(null);

    try {
      const res = await fetch("/api/consulta", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cedula }),
      });

      const json = await res.json();
      setRespuesta(json);
    } catch (err) {
      setErrorConexion("Ocurrió un error al consultar el servicio. Inténtalo nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const limpiar = () => {
    setCedula("");
    setRespuesta(null);
    setErrorConexion("");
  };

  const estado = respuesta?.Estado || "";
  const mensajes = Array.isArray(respuesta?.Mensajes) ? respuesta.Mensajes : [];

  let datos = [];
  try {
    const rawDatos = respuesta?.Datos ?? [];
    datos = typeof rawDatos === "string" ? JSON.parse(rawDatos) : rawDatos;
  } catch {
    datos = [];
  }

  const plan = Array.isArray(datos) && datos.length > 0 ? datos[0] : {};
  const titular = plan?.Titular || {};
  const beneficiarios = Array.isArray(plan?.Beneficiarios) ? plan.Beneficiarios : [];

  const hayErrorNegocio = estado === "Error";
  const hayExito = estado === "OK" || plan?.Estado === "ACTIVO";

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.logoWrap}>
          <img
            src="/logo-proassislife.png"
            alt="Proassislife"
            style={styles.logo}
          />
        </div>

        <div style={styles.heroCard}>
          <h1 style={styles.title}>Consulta cobertura Farmaenlace</h1>
          <p style={styles.subtitle}>
            Ingresa el número de cédula para consultar la información disponible.
          </p>

          <div style={styles.searchRow}>
            <input
              type="text"
              placeholder="Ingresa la cédula"
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
              style={styles.input}
              maxLength={13}
            />

            <button
              onClick={consultar}
              style={styles.buttonPrimary}
              disabled={loading}
            >
              {loading ? "Consultando..." : "Consultar"}
            </button>

            <button
              onClick={limpiar}
              style={styles.buttonSecondary}
              type="button"
            >
              Limpiar
            </button>
          </div>
        </div>

        {errorConexion && (
          <div style={styles.errorCard}>
            <div style={styles.errorItem}>
              <div style={styles.errorIcon}>⚠️</div>
              <div>
                <div style={styles.errorTitle}>Error de conexión</div>
                <div style={styles.errorText}>{errorConexion}</div>
              </div>
            </div>
          </div>
        )}

        {hayErrorNegocio && mensajes?.length > 0 && (
          <div style={styles.errorCard}>
            {mensajes.map((m, i) => {
              const tipo = obtenerTipoError(m);

              return (
                <div key={i} style={styles.errorItem}>
                  <div style={styles.errorIcon}>
                    {tipo === "cedula" && "⚠️"}
                    {tipo === "carencia" && "⏳"}
                    {tipo === "preexistencia" && "🧬"}
                    {tipo === "mora" && "💰"}
                    {tipo === "no_afiliado" && "❌"}
                    {tipo === "general" && "⚠️"}
                  </div>

                  <div>
                    <div style={styles.errorTitle}>
                      {tipo === "cedula" && "Debes ingresar la cédula"}
                      {tipo === "carencia" && "Afiliado en período de carencia"}
                      {tipo === "preexistencia" && "Preexistencia detectada"}
                      {tipo === "mora" && "Cliente en mora"}
                      {tipo === "no_afiliado" && "No se encontró afiliado"}
                      {tipo === "general" && "Ocurrió un inconveniente"}
                    </div>

                    <div style={styles.errorText}>{m}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!hayErrorNegocio && respuesta && (
          <>
            <div style={styles.statusBanner}>
              <div>
                <div style={styles.statusLabel}>Estado de la consulta</div>
                <div style={styles.statusValue}>
                  {hayExito ? "Cobertura encontrada" : respuesta?.Estado || "Consulta realizada"}
                </div>
              </div>
              <div style={hayExito ? styles.statusBadgeOk : styles.statusBadge}>
                {plan?.Estado || respuesta?.Estado || "-"}
              </div>
            </div>

            <div style={styles.resultsWrapper}>
              <SectionTitle>Información del plan</SectionTitle>
              <div style={styles.card}>
                <InfoGrid
                  items={[
                    ["Estado", <span style={styles.estadoOk}>{plan?.Estado || respuesta?.Estado || "-"}</span>],
                    ["Producto", plan?.Producto || "-"],
                    ["Plan", plan?.NombrePlan || "-"],
                    ["Tipo de vademécum", plan?.Vademecum || "-"],
                    ["Código plan", plan?.CodigoPlan || "-"],
                    ["Contrato", plan?.Numero || "-"],
                    ["Cobertura máxima", plan?.CoberturaMaxima ?? "-"],
                    ["Versión", plan?.Version ?? "-"],
                  ]}
                />
              </div>

              <SectionTitle>Titular</SectionTitle>
              <div style={styles.card}>
                <InfoGrid
                  items={[
                    ["Nombre", unirNombre(titular?.Nombres, titular?.Apellidos)],
                    ["Documento", unirDocumento(titular?.TipoDocumento, titular?.NumeroDocumento)],
                    ["Edad", titular?.Edad ?? calcularEdad(titular?.FechaNacimiento) ?? "-"],
                    ["Género", titular?.Genero || "-"],
                    ["Fecha nacimiento", formatearFecha(titular?.FechaNacimiento)],
                    ["Deducible total", titular?.DeducibleTotal ?? "-"],
                    ["Es moroso", valorBooleano(titular?.EsMoroso)],
                    ["Fecha inicio", formatearFecha(plan?.FechaInicio)],
                    ["Fecha vigencia", formatearFecha(plan?.FechaVigencia)],
                  ]}
                />
              </div>

              <SectionTitle>Beneficiarios</SectionTitle>
              {beneficiarios.length > 0 ? (
                beneficiarios.map((benef, index) => (
                  <div style={styles.card} key={index}>
                    <InfoGrid
                      items={[
                        ["Nombre", unirNombre(benef?.Nombres, benef?.Apellidos)],
                        ["Documento", unirDocumento(benef?.TipoDocumento, benef?.NumeroDocumento)],
                        ["Relación", benef?.RelacionDependiente || "-"],
                        ["Edad", benef?.Edad ?? "-"],
                        ["Género", benef?.Genero || "-"],
                        ["Fecha nacimiento", formatearFecha(benef?.FechaNacimiento)],
                        ["En carencia", valorBooleano(benef?.EnCarencia)],
                      ]}
                    />

                    {Array.isArray(benef?.BeneficiosPlan) && benef.BeneficiosPlan.length > 0 && (
                      <div style={{ marginTop: 18 }}>
                        <div style={styles.subTitle}>Beneficios del plan</div>
                        <div style={styles.benefitsWrap}>
                          {benef.BeneficiosPlan.map((b, i) => (
                            <div key={i} style={styles.benefitChip}>
                              Valor: {b?.Valor ?? "-"} | Es por plan: {valorBooleano(b?.EsPorPlan)}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div style={styles.card}>
                  <span>No existen beneficiarios registrados.</span>
                </div>
              )}

              {mensajes?.length > 0 && (
                <>
                  <SectionTitle>Mensajes</SectionTitle>
                  <div style={styles.card}>
                    {mensajes.map((m, i) => (
                      <div key={i} style={styles.messageItem}>
                        {m}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SectionTitle({ children }) {
  return <h2 style={styles.sectionTitle}>{children}</h2>;
}

function InfoGrid({ items }) {
  return (
    <div style={styles.grid}>
      {items.map(([label, value], index) => (
        <div key={index} style={styles.gridItem}>
          <div style={styles.label}>{label}:</div>
          <div style={styles.value}>{value || "-"}</div>
        </div>
      ))}
    </div>
  );
}

function unirNombre(nombres, apellidos) {
  return [nombres, apellidos].filter(Boolean).join(" ") || "-";
}

function unirDocumento(tipo, numero) {
  return [tipo, numero].filter(Boolean).join(" ") || "-";
}

function valorBooleano(valor) {
  if (valor === true || valor === "true") return "Sí";
  if (valor === false || valor === "false") return "No";
  return valor ?? "-";
}

function formatearFecha(fecha) {
  if (!fecha) return "-";
  const soloFecha = String(fecha).split("T")[0];
  const partes = soloFecha.split("-");
  if (partes.length !== 3) return soloFecha;
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function calcularEdad(fecha) {
  if (!fecha) return null;
  const nacimiento = new Date(fecha);
  if (Number.isNaN(nacimiento.getTime())) return null;

  const hoy = new Date();
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const m = hoy.getMonth() - nacimiento.getMonth();

  if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }

  return edad;
}

function obtenerTipoError(mensaje) {
  if (!mensaje) return "general";

  const m = mensaje.toUpperCase();

  if (m.includes("CAMPO REQUERIDO")) return "cedula";
  if (m.includes("CARENCIA")) return "carencia";
  if (m.includes("PREEXISTENCIA")) return "preexistencia";
  if (m.includes("MORA")) return "mora";
  if (m.includes("SERVICIO AL CLIENTE")) return "no_afiliado";

  return "general";
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #eef3fb 0%, #f8fbff 100%)",
    padding: "28px",
    fontFamily: "Arial, sans-serif",
  },
  container: {
    maxWidth: "1180px",
    margin: "0 auto",
  },
  logoWrap: {
    textAlign: "center",
    marginBottom: "20px",
  },
  logo: {
    maxWidth: "360px",
    width: "100%",
    height: "auto",
  },
  heroCard: {
    background: "#ffffff",
    borderRadius: "24px",
    padding: "34px",
    boxShadow: "0 12px 30px rgba(16, 24, 40, 0.08)",
    border: "1px solid #e6edf8",
  },
  title: {
    textAlign: "center",
    margin: 0,
    color: "#17356d",
    fontSize: "42px",
    fontWeight: "700",
  },
  subtitle: {
    textAlign: "center",
    color: "#5e6f8e",
    fontSize: "16px",
    marginTop: "10px",
    marginBottom: "30px",
  },
  searchRow: {
    display: "flex",
    gap: "14px",
    flexWrap: "wrap",
  },
  input: {
    flex: 1,
    minWidth: "260px",
    padding: "18px 20px",
    borderRadius: "16px",
    border: "1px solid #cfd7e6",
    fontSize: "28px",
    outline: "none",
    background: "#fcfdff",
  },
  buttonPrimary: {
    padding: "0 28px",
    borderRadius: "16px",
    border: "none",
    background: "#2f66e8",
    color: "#fff",
    fontSize: "18px",
    fontWeight: "700",
    cursor: "pointer",
    minHeight: "62px",
  },
  buttonSecondary: {
    padding: "0 24px",
    borderRadius: "16px",
    border: "1px solid #cfd7e6",
    background: "#fff",
    color: "#17356d",
    fontSize: "16px",
    fontWeight: "700",
    cursor: "pointer",
    minHeight: "62px",
  },
  statusBanner: {
    marginTop: "24px",
    background: "#17356d",
    color: "#fff",
    borderRadius: "18px",
    padding: "22px 24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    flexWrap: "wrap",
    boxShadow: "0 10px 24px rgba(23, 53, 109, 0.18)",
  },
  statusLabel: {
    fontSize: "14px",
    opacity: 0.85,
    marginBottom: "6px",
  },
  statusValue: {
    fontSize: "24px",
    fontWeight: "700",
  },
  statusBadge: {
    background: "#ffffff22",
    border: "1px solid #ffffff33",
    borderRadius: "999px",
    padding: "10px 18px",
    fontWeight: "700",
  },
  statusBadgeOk: {
    background: "#d1fadf",
    color: "#067647",
    border: "1px solid #a6f4c5",
    borderRadius: "999px",
    padding: "10px 18px",
    fontWeight: "700",
  },
  resultsWrapper: {
    marginTop: "18px",
    background: "#ffffff",
    borderRadius: "24px",
    padding: "30px",
    boxShadow: "0 12px 30px rgba(16, 24, 40, 0.06)",
    border: "1px solid #e6edf8",
  },
  sectionTitle: {
    color: "#0e539c",
    fontSize: "26px",
    fontStyle: "italic",
    marginTop: "18px",
    marginBottom: "14px",
    borderBottom: "1px solid #d9e1ef",
    paddingBottom: "10px",
  },
  card: {
    background: "#f7f9fc",
    border: "1px solid #d5dcea",
    borderRadius: "12px",
    padding: "18px 20px",
    marginBottom: "18px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "16px 26px",
  },
  gridItem: {
    minHeight: "40px",
  },
  label: {
    fontWeight: "700",
    fontStyle: "italic",
    color: "#232f4b",
    marginBottom: "4px",
  },
  value: {
    color: "#4b5565",
    lineHeight: 1.35,
    wordBreak: "break-word",
  },
  estadoOk: {
    color: "#138a36",
    fontWeight: "700",
  },
  subTitle: {
    fontWeight: "700",
    color: "#17356d",
    marginBottom: "10px",
  },
  benefitsWrap: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  benefitChip: {
    background: "#e9f0ff",
    color: "#17356d",
    border: "1px solid #c6d6ff",
    borderRadius: "999px",
    padding: "8px 12px",
    fontSize: "14px",
  },
  messageItem: {
    padding: "10px 0",
    borderBottom: "1px solid #e5e9f2",
    color: "#344054",
  },
  errorCard: {
    background: "#fff4f4",
    border: "1px solid #f5c2c7",
    borderRadius: "16px",
    padding: "20px",
    marginTop: "22px",
  },
  errorItem: {
    display: "flex",
    gap: "14px",
    alignItems: "flex-start",
  },
  errorIcon: {
    fontSize: "28px",
    lineHeight: 1,
  },
  errorTitle: {
    fontWeight: "700",
    color: "#b42318",
    marginBottom: "6px",
    fontSize: "18px",
  },
  errorText: {
    color: "#5f2120",
    fontSize: "15px",
    lineHeight: 1.5,
  },
};
