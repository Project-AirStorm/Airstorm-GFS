
/**
 * Dispatches an event when the user role changes
 * @param {string} role - The new role value
 */
export const notifyRoleChanged = (role) => {
    window.dispatchEvent(new CustomEvent('userRoleChanged', { 
      detail: role 
    }));
  };