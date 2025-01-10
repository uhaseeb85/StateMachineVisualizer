export const saveDataToLocalStorage = (data) => {
    try {
      localStorage.setItem('ivr-flow-data', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  };
  
  export const loadDataFromLocalStorage = () => {
    try {
      const data = localStorage.getItem('ivr-flow-data');
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      return null;
    }
  };