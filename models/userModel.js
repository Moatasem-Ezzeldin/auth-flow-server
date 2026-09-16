const mongoose = require("mongoose");
const slugify = require("slugify");
const { hashPassword } = require("../utils/passwordUtils");

const userSchema = new mongoose.Schema({
    // BASIC USER INFO
    name: {
        type: String,
        trim: true,
        required: [true, "Name is required"],
        minlength: [2, "Too short name"],
        maxlength: [100, "Too long name"],   
    },
    slug: {
        type: String,
        lowercase: true,
    },
    email: {
        type: String,
        required: [true, "Email is required"], 
        unique: true,
        lowercase: true,
        trim: true,
    },
    
    phone: String,
    
    password: {
        type: String,
        required: function () {
            return !this.provider || this.provider.includes("local");
        },
        minlength: [6, "Too short password"],
        select: false,
    },
    
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user",
    },
    active: {
        type: Boolean,
        default: true,
    },
    avatar: {
        url: String,
        public_id: String,
        type: {
            type: String,
        },
        encoding: String,
        originalName: String,
        fieldName: String,
        mimeType: String,
        ext: String,
        size: Number,
    },
    // AUTH STATUS
    isVerified: {
        type: Boolean,
        default: false,
    },
    emailVerifyToken: String,
    emailVerifyExpires: Date,
    emailResendAvailableAt: Date,
    emailVerifyLastSentAt: Date,
    // PASSWORD RESET
    passwordChangedAt: Date,
    passwordResetCode: String,
    passwordResetExpires: Date,
    passwordResendAvailableAt: Date,
    passwordResetLastSentAt: Date,
    passwordResetVerified: Boolean,
    // OAUTH PROVIDER
    provider: {
        type: [String],
        enum: ["local", "google", "github"],
        default: ["local"],
        validate: {
            validator: function (v) {
            return Array.isArray(v) && v.length > 0;
            },
            message: "Provider must have at least one value",
        },
    },

    googleId: String,
    githubId: String,
    // SESSIONS (MULTI DEVICE LOGIN)
    sessions: [
        {
            id: {
               type: String, 
            },
            refreshToken: {
                type: String,
            },
            userAgent: {
                type: String,
                default: "unknown",
            },
            ip: {
                type: String,
                default: "unknown",
            },
            createdAt: {
                type: Date,
                default: Date.now,
            },
            lastUsedAt: {
                type: Date,
                default: Date.now,
            },
            expiresAt: {
                type: Date,
                required: true,
            },
        },
    ],
}, { timestamps: true });

// Add Slug BEFORE SAVE
userSchema.pre("save", function() {
    if(!this.isModified('name')) return;
    if(!this.name) return;
    this.slug = slugify(this.name, { lower: true, strict: true });
});

// HASH PASSWORD BEFORE SAVE
userSchema.pre("save", async function() {
    if(!this.isModified('password')) 
        return;
    this.password = await hashPassword(this.password, 12);
});

// SET PASSWORD CHANGE TIME
userSchema.pre("save", function() {
    if(!this.isModified('password') || this.isNew) 
        return;
    this.passwordChangedAt = Date.now() - 1000;
});

const UserModel = mongoose.model("User", userSchema);

module.exports = UserModel;