export const saveDataToLocalStorage = (data) => {
    localStorage.setItem("ivrFlow", JSON.stringify(data));
  };
  
  export const loadDataFromLocalStorage = () => {
    const data = localStorage.getItem("ivrFlow");
    return data ? JSON.parse(data) : null;
  };
  