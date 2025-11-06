import { sequelizeInstance } from '../config/db.js';
import UserModel from './user.model.js';
import CategoryModel from './category.model.js';
import ProductModel from './product.model.js';

const User = UserModel(sequelizeInstance);
const Category = CategoryModel(sequelizeInstance);
const Product = ProductModel(sequelizeInstance);

// Relations
Category.hasMany(Product, { foreignKey: 'categoryId', onDelete: 'RESTRICT' });
Product.belongsTo(Category, { foreignKey: 'categoryId' });

// Export
export const sequelize = sequelizeInstance;
export { User, Category, Product };
