import { apiGet } from "../../../auth/api";

export async function getDashboardStats() {
  const [usersRes, labsRes, cargosRes, deptosRes] = await Promise.allSettled([
    apiGet("/api/User/get-users"),
    apiGet("/api/catalogos/laboratorios"),
    apiGet("/api/catalogos/cargos"),
    apiGet("/api/catalogos/departamentos"),
  ]);

  const users = usersRes.status === "fulfilled" ? (usersRes.value.users ?? []) : [];
  const labs = labsRes.status === "fulfilled" ? (labsRes.value ?? []) : [];
  const cargos = cargosRes.status === "fulfilled" ? (cargosRes.value ?? []) : [];
  const deptos = deptosRes.status === "fulfilled" ? (deptosRes.value ?? []) : [];

  return {
    totalUsuarios: users.length,
    totalLaboratorios: labs.length,
    totalCargos: cargos.length,
    totalDepartamentos: deptos.length,
    usuariosActivos: users.filter((u) => u.activo).length,
    usuariosInactivos: users.filter((u) => !u.activo).length,
    recentUsers: users.slice(0, 5),
  };
}
