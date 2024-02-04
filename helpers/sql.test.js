const { sqlForPartialUpdate } = require('./sql');


describe('sqlForPartialUpdate', () => {
    it('should generate SQL setCols and values for valid dataToUpdate', () => {
        const dataToUpdate = { firstName: 'John', age: 32 };
        const jsToSql = { firstName: 'first_name' };
        const result = sqlForPartialUpdate(dataToUpdate, jsToSql);

        expect(result).toEqual({
            setCols: '"first_name"=$1, "age"=$2',
            values: ['John', 32],
        });
    });

    it('should generate SQL setCols and values with default column names if jsToSql is not provided', () => {
        const dataToUpdate = { firstName: 'Aliya', age: 32 };
        const result = sqlForPartialUpdate(dataToUpdate);

        expect(result).toEqual({
            setCols: '"firstName"=$1, "age"=$2',
            values: ['Aliya', 32],
        });
    });

    it('should throw a BadRequestError if no data is provided', () => {
        const dataToUpdate = {};

        expect(() => sqlForPartialUpdate(dataToUpdate)).toThrow('No data');
    });
});
