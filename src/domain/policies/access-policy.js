const matrix = {
  admin: ['product-model:create', 'monitor:manage', 'checkpoint:write', 'checkpoint:review'],
  supervisor: ['checkpoint:write', 'checkpoint:review', 'monitor:view'],
  operator: ['checkpoint:write', 'monitor:view']
};

const can = (role, action) => {
  if (!role || !matrix[role]) {
    return false;
  }
  return matrix[role].includes(action);
};

module.exports = {
  can
};
