import mongoose from "mongoose";

const { Schema, model } = mongoose;

const reviewsSchema = new Schema({
  comment: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
});

const productSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    brand: { type: String, required: true },
    imageUrl: { type: String },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    reviews: [reviewsSchema],
  },
  {
    timestamps: true,
  }
);

export default model("Product", productSchema);
