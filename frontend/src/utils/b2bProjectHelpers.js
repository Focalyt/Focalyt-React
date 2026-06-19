export const getProjectDepartmentIds = (project) => {
  if (!project) return [];
  const fromArray = (project.departments || []).map((d) => String(d?._id || d));
  if (fromArray.length) return fromArray;
  if (project.department) return [String(project.department?._id || project.department)];
  return [];
};

export const projectBelongsToDepartment = (project, departmentId) => {
  if (!departmentId) return false;
  return getProjectDepartmentIds(project).includes(String(departmentId));
};

export const formatProjectDepartments = (project) => {
  const depts = project?.departments;
  if (Array.isArray(depts) && depts.length) {
    return depts.map((d) => d?.name || '—').filter(Boolean).join(', ');
  }
  return project?.department?.name || '—';
};
