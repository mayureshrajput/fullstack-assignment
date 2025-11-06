import { DataTypes } from 'sequelize';
export default (sequelize) => {
  const Product = sequelize.define('Product', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    uid: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, unique: true },
    name: { type: DataTypes.STRING(150), allowNull: false },
    image: { type: DataTypes.STRING(500), allowNull: true },
    price: { type: DataTypes.DECIMAL(10,2), allowNull: false },
    categoryId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false }
  }, { tableName: 'products' });
  return Product;
};
