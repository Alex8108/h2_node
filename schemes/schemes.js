exports.mailOrderParametersSchema = {
    "id": "/mailOrder",
    "type": "object",
    "properties": {
      "name": {"type": "string", maxLength: 20},
      "telephone": {"type": "string", maxLength: 20},
      "comment": {"type": "string", maxLength: 1000}
    },
    "required": ["name", "telephone"]
};