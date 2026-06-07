import { apiGet } from "../../../auth/api";

export async function getTecnicasAnalisis() {
  const res = await apiGet("/api/catalogos/tecnicas-analisis");
  return res ?? [];
}
