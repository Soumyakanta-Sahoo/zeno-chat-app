const mangoose = require("mongoose");

const userSchema = new mangoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
}, { timestamps: true });

module.exports = mangoose.model("User", userSchema);
