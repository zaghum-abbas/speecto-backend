const Joi = require("joi");

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

const inviteSchema = Joi.object({
  email: Joi.string().email().required(),
});

const onboardSchema = Joi.object({
  password: Joi.string().min(6).required(),
  token: Joi.string().required(),
});

const patientSchema = Joi.object({
  name: Joi.string().required(),
  age: Joi.number().required(),
  prescription: Joi.string().required(),
  title: Joi.string().required(),
  description: Joi.string().required(),
  date: Joi.string().required(),
});

const reminderSchema = Joi.object({
  reminder: Joi.date().required(),
});

module.exports = {
  loginSchema,
  inviteSchema,
  onboardSchema,
  patientSchema,
  reminderSchema,
};
