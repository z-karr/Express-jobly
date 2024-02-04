const { BadRequestError } = require("../expressError");

// THIS NEEDS SOME GREAT DOCUMENTATION.

// Generate SQL statements for a partial update operation in the database.
// 
//    - Takes 2 params: 
//          - "dataToUpdate", an obj with data to update
//          - "jsToSql", mapping to translate JS keys to SQL column names
// 
//    - Throws "BadRequestError" if no data is provided for update.
//    
//    - Returns an obj with 2 properties: 
//          - "setCols", a str for the SQL "SET" clause with col names and placeholders
//          - "values", an arr of values from "dataToUpdate" for SQL param values
// 
//    Example usage:
//      
//      const dataToUpdate = { firstName: 'Aliya', age: 32 };
//      const jsToSql = { firstName: 'first_name' };
//      const { setCols, values } = sqlForPartialUpdate(dataToUpdate, jsToSql);
// 
//    Example result: 
//    
//    {
//      setCols: '"first_name"=$1, "age"=$2',
//      values: ['Aliya', 32]
//    }

function sqlForPartialUpdate(dataToUpdate, jsToSql = {}) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
    `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
