export const saveDataToLocalStorage = (data) => {
  try {
    localStorage.setItem('flowState', JSON.stringify(data));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

export const loadDataFromLocalStorage = () => {
  try {
    const data = localStorage.getItem('flowState');
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    return null;
  }
}; 