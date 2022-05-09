const { Schema, model, default: mongoose } = require("mongoose");

const userSchema = new Schema({
  name: { type: String, required: true, trim: true },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    match: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
  },
  accountNumber: {type:Number, unique:true, minlength:1},
  balance: {type:Number, minlength:0, default:0},
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ["ADMIN", "USER"], default: "USER" },
  isActive: { type: Boolean, default: true },
  disabledOn: { type: Date },
});

const UserModel = model("User", userSchema);

module.exports = UserModel;
