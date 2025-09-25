const mongoose= require('mongoose')


const whatappChatSchema= new mongoose.Schema({

    messageId: { type: String, required: true, unique: true },
    sender: { type: String, required: true }, // Sender's phone number or user ID
    receiver: { type: String, required: true }, // Receiver's phone number or user ID
    messageType: {
      type: String,
      enum: ['text', 'image', 'video', 'document', 'audio', 'location'],
      required: true,
    },
    messageContent: {
      type: String, // Text content for text messages
      default: '',
    },
    mediaUrl: {
      type: String, // URL of the media (if message type is image/video/document/audio)
      default: '',
    },
    mediaType: {
      type: String, // Type of media (e.g., 'image', 'video', etc.)
      enum: ['image', 'video', 'document', 'audio', 'location'],
      default: '',
    },
    location: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
    },
    timestamp: { type: Date, default: Date.now }, // Timestamp of message
    status: {
      type: String,
      enum: ['sent', 'delivered', 'read'],
      default: 'sent',
    }, // Status of the message
    isReply: { type: Boolean, default: false }, // Whether the message is a reply to another message
    replyToMessageId: { type: String, default: '' }, // ID of the original message, if reply
  });
  const WhatsAppChatSchema = new Schema({
    chatId: { type: String, required: true, unique: true },
    participants: [
      {
        phoneNumber: { type: String, required: true }, // Participant's phone number
        name: { type: String, required: true }, // Participant's name
      },
    ],
    messages: [MessageSchema], // Array of message objects
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  });


module.exports= mongoose.model('whatappChat', whatappChatSchema)