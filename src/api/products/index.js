import express from "express";
import createHttpError from "http-errors";
import ProductsModel from "./model.js";
import q2m from "query-to-mongo";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

const productsRouter = express.Router();

productsRouter.post("/", async (req, res, next) => {
  try {
    const newProduct = new ProductsModel(req.body);
    const { _id } = await newProduct.save();
    res.status(201).send({ _id });
  } catch (error) {
    next(error);
  }
});
productsRouter.get("/", async (req, res, next) => {
  try {
    const mongoQuery = q2m(req.query);
    const products = await ProductsModel.find(
      mongoQuery.criteria,
      mongoQuery.options.fields
    )
      .limit(mongoQuery.options.limit)
      .skip(mongoQuery.options.skip)
      .sort(mongoQuery.options.sort);
    const total = await ProductsModel.countDocuments(mongoQuery.criteria);
    res.send({
      links: mongoQuery.links(process.env.LINK_URL + "/products", total),
      total,
      numberOfPages: Math.ceil(total / mongoQuery.options.limit),
      products,
    });
  } catch (error) {
    next(error);
  }
});
productsRouter.get("/:productId", async (req, res, next) => {
  try {
    const products = await ProductsModel.findById(req.params.productId);
    if (products) {
      res.send(products);
    } else {
      next(
        createHttpError(
          404,
          `Product with id ${req.params.productId} not found`
        )
      );
    }
  } catch (error) {
    next(error);
  }
});
productsRouter.put("/:productId", async (req, res, next) => {
  try {
    const updatedProduct = await ProductsModel.findByIdAndUpdate(
      req.params.productId,
      req.body,
      { new: true, runValidators: true }
    );
    if (updatedProduct) {
      res.send(updatedProduct);
    } else {
      next(
        createHttpError(
          404,
          `Product with id ${req.params.productId} not found`
        )
      );
    }
  } catch (error) {
    next(error);
  }
});
productsRouter.delete("/:productId", async (req, res, next) => {
  try {
    const deletedProduct = await ProductsModel.findByIdAndDelete(
      req.params.productId
    );
    if (deletedProduct) {
      res.send(204).send();
    } else {
      next(
        createHttpError(
          404,
          `Product with id ${req.params.productId} not found`
        )
      );
    }
  } catch (error) {
    next(error);
  }
});

const cloudinaryUploader = multer({
  storage: new CloudinaryStorage({
    cloudinary,
    params: {
      folder: "BE-DB/marketPlace",
    },
  }),
}).single("productImg");

productsRouter.post(
  "/:productId/uploadImage",
  cloudinaryUploader,
  async (req, res, next) => {
    try {
      const product = await ProductsModel.findById(req.params.productId);
      product.imageUrl = req.file.path;
      await product.save();
      if (product) {
        res.send({ message: "File uploaded successfully" });
      } else {
        next(
          createHttpError(
            404,
            `Product with id ${req.params.productId} not found`
          )
        );
      }
    } catch (error) {
      next(error);
    }
  }
);

productsRouter.post("/:productId/reviews", async (req, res, next) => {
  try {
    const newReview = req.body;
    const reviewToInsert = {
      ...newReview,
    };
    const updatedProduct = await ProductsModel.findByIdAndUpdate(
      req.params.productId,
      {
        $push: { reviews: reviewToInsert },
      },
      {
        new: true,
        runValidators: true,
      }
    );
    if (updatedProduct) {
      res.send(updatedProduct);
    } else {
      next(
        createHttpError(
          404,
          `Product with id ${req.params.productId} not found`
        )
      );
    }
  } catch (error) {
    next(error);
  }
});

productsRouter.get("/:productId/reviews", async (req, res, next) => {
  try {
    const review = await ProductsModel.findById(req.params.productId);
    if (review) {
      res.send(review.reviews);
    } else {
      next(
        createHttpError(
          404,
          `Product with id ${req.params.productId} not found`
        )
      );
    }
  } catch (error) {
    next(error);
  }
});
productsRouter.get("/:productId/reviews/:reviewId", async (req, res, next) => {
  try {
    const review = await ProductsModel.findById(req.params.productId);
    if (review) {
      const selectedReview = review.reviews.find(
        (r) => r._id.toString() === req.params.reviewId
      );
      if (selectedReview) {
        res.send(selectedReview);
      } else {
        next(
          createHttpError(
            404,
            `Review with id ${req.params.reviewId} not found`
          )
        );
      }
    } else {
      next(
        createHttpError(
          404,
          `Product with id ${req.params.productId} not found`
        )
      );
    }
  } catch (error) {
    next(error);
  }
});
productsRouter.put("/:productId/reviews/:reviewId", async (req, res, next) => {
  try {
    const review = await ProductsModel.findById(req.params.productId);
    if (review) {
      const index = review.reviews.findIndex(
        (r) => r._id.toString() === req.params.reviewId
      );
      if (index !== -1) {
        review.reviews[index] = {
          ...review.reviews[index].toObject(),
          ...req.body,
        };
        await review.save();
        res.send(review);
      } else {
        next(
          createHttpError(
            404,
            `Review with id ${req.params.reviewId} not found`
          )
        );
      }
    } else {
      next(
        createHttpError(
          404,
          `Product with id ${req.params.productId} not found`
        )
      );
    }
  } catch (error) {
    next(error);
  }
});
productsRouter.delete(
  "/:productId/reviews/:reviewId",
  async (req, res, next) => {
    try {
      const updatedProduct = await ProductsModel.findByIdAndUpdate(
        req.params.productId,
        { $pull: { reviews: { _id: req.params.reviewId } } },
        { new: true, runValidators: true }
      );
      if (updatedProduct) {
        res.send(updatedProduct);
      } else {
        next(
          createHttpError(
            404,
            `Product with id ${req.params.productId} not found`
          )
        );
      }
    } catch (error) {
      next(error);
    }
  }
);

export default productsRouter;
