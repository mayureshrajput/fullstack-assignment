import { DataTypes } from 'sequelize';
export default (sequelize) => {
  const Category = sequelize.define('Category', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    uid: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, unique: true },
    name: { type: DataTypes.STRING(100), allowNull: false, unique: true }
  }, { tableName: 'categories' });
  return Category;
};
