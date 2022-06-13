const employeeSchema = {
  title: 'Employee',
  description: 'Object containing employee details',
  type: 'object',
  additonalProperties: false,
  properties: {
    personalDetails: {
      $ref: 'personal'
    },
    availableToHire: {
      type: 'boolean',
      default: false
    },
    job: {
      $ref: 'job'
    },
    profession: {
      oneOf: [
        {
          $ref: 'junior'
        },
        {
          $ref: 'experienced'
        },
        {
          $ref: 'senior'
        }
      ]
    },
    reporters: {
      type: 'array',
      items: {
        $ref: 'employeeSchema'
      }
    },
    publications: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['academic', 'professional']
          },
          journal: {
            type: 'string'
          }
        }
      }
    }
  },
  required: ['personalDetails']
}

const personal = {
  title: 'Personal Details',
  type: 'object',
  required: ['firstName', 'lastName'],
  properties: {
    firstName: {
      title: 'First Name',
      description: 'The given name.',
      examples: [
        'John'
      ],
      type: 'string'
    },
    lastName: {
      title: 'Last Name',
      description: 'The family name.',
      examples: [
        'Smith'
      ],
      type: 'string'
    },
    gender: {
      title: 'Gender',
      type: 'string',
      enum: ['male', 'female'],
      examples: ['male', 'female']
    },
    age: {
      description: 'Age in years',
      type: 'integer',
      minimum: 0,
      examples: [28, 32]
    }
  }
}

const job = {
  title: 'Job description',
  type: 'object',
  required: ['address'],
  properties: {
    company: {
      type: 'string',
      examples: [
        'ACME',
        'Dexter Industries'
      ]
    },
    role: {
      description: 'Job title.',
      type: 'string',
      examples: [
        'Human Resources Coordinator',
        'Software Developer'
      ],
      default: 'Software Developer'
    },
    address: {
      type: 'string'
    },
    salary: {
      type: 'number',
      minimum: 120,
      examples: [100, 110, 120]
    }
  }
}

const junior = {
  type: 'object',
  properties: {
    level: {
      type: 'string',
      enum: ['junior']
    },
    experience: {
      description: 'years of experience',
      type: 'number',
      minimum: 0,
      maximum: 3,
      examples: [0, 1, 2, 3]
    }
  }
}

const experienced = {
  type: 'object',
  properties: {
    level: {
      type: 'string',
      enum: ['experienced']
    },
    experience: {
      description: 'years of experience',
      type: 'number',
      minimum: 3,
      maximum: 7,
      examples: [3, 4, 5, 6, 7]
    }
  }
}

const senior = {
  type: 'object',
  properties: {
    level: {
      type: 'string',
      enum: ['senior']
    },
    experience: {
      description: 'years of experience',
      type: 'number',
      minimum: 7,
      examples: [7, 8, 9, 10, 11]
    }
  }
}

export const schema = {
  oneOf: [
    {
      $ref: 'employeeSchema'
    }
  ]
}

export const schemaRefs = { employeeSchema, personal, job, junior, experienced, senior }
