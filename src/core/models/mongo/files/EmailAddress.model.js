import mongoose from 'mongoose';

const emailAddress = mongoose.model(
  'emailaddress',
  new mongoose.Schema({
    emailAddress: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
  })
);

export default emailAddress;
