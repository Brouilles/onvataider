import { Mongo } from 'meteor/mongo';

const Categories = new Mongo.Collection('productCategories');
export default Categories;
