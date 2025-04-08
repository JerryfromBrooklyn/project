import {
  BatchExecuteStatementCommand,
  BatchGetItemCommand,
  BatchWriteItemCommand,
  DeleteItemCommand,
  ExecuteStatementCommand,
  ExecuteTransactionCommand,
  GetItemCommand,
  PutItemCommand,
  QueryCommand,
  ScanCommand,
  TransactGetItemsCommand,
  TransactWriteItemsCommand,
  UpdateItemCommand
} from "./chunk-LBN6F5CD.js";
import "./chunk-NTQLP465.js";
import {
  Client,
  Command,
  createPaginator,
  setFeature
} from "./chunk-DVXMMF4H.js";
import {
  NumberValue,
  marshall,
  unmarshall
} from "./chunk-HDN46DWL.js";
import {
  __publicField
} from "./chunk-UV5CTPV7.js";

// node_modules/@aws-sdk/lib-dynamodb/dist-es/commands/utils.js
var SELF = null;
var ALL_VALUES = {};
var ALL_MEMBERS = [];
var NEXT_LEVEL = "*";
var processObj = (obj, processFunc, keyNodes) => {
  if (obj !== void 0) {
    if (keyNodes == null) {
      return processFunc(obj);
    } else {
      const keys = Object.keys(keyNodes);
      const goToNextLevel = keys.length === 1 && keys[0] === NEXT_LEVEL;
      const someChildren = keys.length >= 1 && !goToNextLevel;
      const allChildren = keys.length === 0;
      if (someChildren) {
        return processKeysInObj(obj, processFunc, keyNodes);
      } else if (allChildren) {
        return processAllKeysInObj(obj, processFunc, SELF);
      } else if (goToNextLevel) {
        return Object.entries(obj ?? {}).reduce((acc, [k, v]) => {
          if (typeof v !== "function") {
            acc[k] = processObj(v, processFunc, keyNodes[NEXT_LEVEL]);
          }
          return acc;
        }, Array.isArray(obj) ? [] : {});
      }
    }
  }
  return void 0;
};
var processKeysInObj = (obj, processFunc, keyNodes) => {
  let accumulator;
  if (Array.isArray(obj)) {
    accumulator = obj.filter((item) => typeof item !== "function");
  } else {
    accumulator = {};
    for (const [k, v] of Object.entries(obj)) {
      if (typeof v !== "function") {
        accumulator[k] = v;
      }
    }
  }
  for (const [nodeKey, nodes] of Object.entries(keyNodes)) {
    if (typeof obj[nodeKey] === "function") {
      continue;
    }
    const processedValue = processObj(obj[nodeKey], processFunc, nodes);
    if (processedValue !== void 0 && typeof processedValue !== "function") {
      accumulator[nodeKey] = processedValue;
    }
  }
  return accumulator;
};
var processAllKeysInObj = (obj, processFunc, keyNodes) => {
  if (Array.isArray(obj)) {
    return obj.filter((item) => typeof item !== "function").map((item) => processObj(item, processFunc, keyNodes));
  }
  return Object.entries(obj).reduce((acc, [key, value]) => {
    if (typeof value === "function") {
      return acc;
    }
    const processedValue = processObj(value, processFunc, keyNodes);
    if (processedValue !== void 0 && typeof processedValue !== "function") {
      acc[key] = processedValue;
    }
    return acc;
  }, {});
};
var marshallInput = (obj, keyNodes, options) => {
  const marshallFunc = (toMarshall) => marshall(toMarshall, options);
  return processKeysInObj(obj, marshallFunc, keyNodes);
};
var unmarshallOutput = (obj, keyNodes, options) => {
  const unmarshallFunc = (toMarshall) => unmarshall(toMarshall, options);
  return processKeysInObj(obj, unmarshallFunc, keyNodes);
};

// node_modules/@aws-sdk/lib-dynamodb/dist-es/baseCommand/DynamoDBDocumentClientCommand.js
var _DynamoDBDocumentClientCommand = class _DynamoDBDocumentClientCommand extends Command {
  addMarshallingMiddleware(configuration) {
    const { marshallOptions = {}, unmarshallOptions = {} } = configuration.translateConfig || {};
    marshallOptions.convertTopLevelContainer = marshallOptions.convertTopLevelContainer ?? true;
    unmarshallOptions.convertWithoutMapWrapper = unmarshallOptions.convertWithoutMapWrapper ?? true;
    this.clientCommand.middlewareStack.addRelativeTo((next, context) => async (args) => {
      setFeature(context, "DDB_MAPPER", "d");
      args.input = marshallInput(args.input, this.inputKeyNodes, marshallOptions);
      context.dynamoDbDocumentClientOptions = context.dynamoDbDocumentClientOptions || _DynamoDBDocumentClientCommand.defaultLogFilterOverrides;
      const input = args.input;
      context.dynamoDbDocumentClientOptions.overrideInputFilterSensitiveLog = () => {
        var _a;
        return (_a = context.inputFilterSensitiveLog) == null ? void 0 : _a.call(context, input);
      };
      return next(args);
    }, {
      name: "DocumentMarshall",
      relation: "before",
      toMiddleware: "serializerMiddleware",
      override: true
    });
    this.clientCommand.middlewareStack.addRelativeTo((next, context) => async (args) => {
      const deserialized = await next(args);
      const output = deserialized.output;
      context.dynamoDbDocumentClientOptions = context.dynamoDbDocumentClientOptions || _DynamoDBDocumentClientCommand.defaultLogFilterOverrides;
      context.dynamoDbDocumentClientOptions.overrideOutputFilterSensitiveLog = () => {
        var _a;
        return (_a = context.outputFilterSensitiveLog) == null ? void 0 : _a.call(context, output);
      };
      deserialized.output = unmarshallOutput(deserialized.output, this.outputKeyNodes, unmarshallOptions);
      return deserialized;
    }, {
      name: "DocumentUnmarshall",
      relation: "before",
      toMiddleware: "deserializerMiddleware",
      override: true
    });
  }
};
__publicField(_DynamoDBDocumentClientCommand, "defaultLogFilterOverrides", {
  overrideInputFilterSensitiveLog(...args) {
  },
  overrideOutputFilterSensitiveLog(...args) {
  }
});
var DynamoDBDocumentClientCommand = _DynamoDBDocumentClientCommand;

// node_modules/@aws-sdk/lib-dynamodb/dist-es/commands/BatchExecuteStatementCommand.js
var BatchExecuteStatementCommand2 = class extends DynamoDBDocumentClientCommand {
  constructor(input) {
    super();
    __publicField(this, "input");
    __publicField(this, "inputKeyNodes", {
      Statements: {
        "*": {
          Parameters: ALL_MEMBERS
        }
      }
    });
    __publicField(this, "outputKeyNodes", {
      Responses: {
        "*": {
          Error: {
            Item: ALL_VALUES
          },
          Item: ALL_VALUES
        }
      }
    });
    __publicField(this, "clientCommand");
    __publicField(this, "middlewareStack");
    this.input = input;
    this.clientCommand = new BatchExecuteStatementCommand(this.input);
    this.middlewareStack = this.clientCommand.middlewareStack;
  }
  resolveMiddleware(clientStack, configuration, options) {
    this.addMarshallingMiddleware(configuration);
    const stack = clientStack.concat(this.middlewareStack);
    const handler = this.clientCommand.resolveMiddleware(stack, configuration, options);
    return async () => handler(this.clientCommand);
  }
};

// node_modules/@aws-sdk/lib-dynamodb/dist-es/commands/BatchGetCommand.js
var BatchGetCommand = class extends DynamoDBDocumentClientCommand {
  constructor(input) {
    super();
    __publicField(this, "input");
    __publicField(this, "inputKeyNodes", {
      RequestItems: {
        "*": {
          Keys: {
            "*": ALL_VALUES
          }
        }
      }
    });
    __publicField(this, "outputKeyNodes", {
      Responses: {
        "*": {
          "*": ALL_VALUES
        }
      },
      UnprocessedKeys: {
        "*": {
          Keys: {
            "*": ALL_VALUES
          }
        }
      }
    });
    __publicField(this, "clientCommand");
    __publicField(this, "middlewareStack");
    this.input = input;
    this.clientCommand = new BatchGetItemCommand(this.input);
    this.middlewareStack = this.clientCommand.middlewareStack;
  }
  resolveMiddleware(clientStack, configuration, options) {
    this.addMarshallingMiddleware(configuration);
    const stack = clientStack.concat(this.middlewareStack);
    const handler = this.clientCommand.resolveMiddleware(stack, configuration, options);
    return async () => handler(this.clientCommand);
  }
};

// node_modules/@aws-sdk/lib-dynamodb/dist-es/commands/BatchWriteCommand.js
var BatchWriteCommand = class extends DynamoDBDocumentClientCommand {
  constructor(input) {
    super();
    __publicField(this, "input");
    __publicField(this, "inputKeyNodes", {
      RequestItems: {
        "*": {
          "*": {
            PutRequest: {
              Item: ALL_VALUES
            },
            DeleteRequest: {
              Key: ALL_VALUES
            }
          }
        }
      }
    });
    __publicField(this, "outputKeyNodes", {
      UnprocessedItems: {
        "*": {
          "*": {
            PutRequest: {
              Item: ALL_VALUES
            },
            DeleteRequest: {
              Key: ALL_VALUES
            }
          }
        }
      },
      ItemCollectionMetrics: {
        "*": {
          "*": {
            ItemCollectionKey: ALL_VALUES
          }
        }
      }
    });
    __publicField(this, "clientCommand");
    __publicField(this, "middlewareStack");
    this.input = input;
    this.clientCommand = new BatchWriteItemCommand(this.input);
    this.middlewareStack = this.clientCommand.middlewareStack;
  }
  resolveMiddleware(clientStack, configuration, options) {
    this.addMarshallingMiddleware(configuration);
    const stack = clientStack.concat(this.middlewareStack);
    const handler = this.clientCommand.resolveMiddleware(stack, configuration, options);
    return async () => handler(this.clientCommand);
  }
};

// node_modules/@aws-sdk/lib-dynamodb/dist-es/commands/DeleteCommand.js
var DeleteCommand = class extends DynamoDBDocumentClientCommand {
  constructor(input) {
    super();
    __publicField(this, "input");
    __publicField(this, "inputKeyNodes", {
      Key: ALL_VALUES,
      Expected: {
        "*": {
          Value: SELF,
          AttributeValueList: ALL_MEMBERS
        }
      },
      ExpressionAttributeValues: ALL_VALUES
    });
    __publicField(this, "outputKeyNodes", {
      Attributes: ALL_VALUES,
      ItemCollectionMetrics: {
        ItemCollectionKey: ALL_VALUES
      }
    });
    __publicField(this, "clientCommand");
    __publicField(this, "middlewareStack");
    this.input = input;
    this.clientCommand = new DeleteItemCommand(this.input);
    this.middlewareStack = this.clientCommand.middlewareStack;
  }
  resolveMiddleware(clientStack, configuration, options) {
    this.addMarshallingMiddleware(configuration);
    const stack = clientStack.concat(this.middlewareStack);
    const handler = this.clientCommand.resolveMiddleware(stack, configuration, options);
    return async () => handler(this.clientCommand);
  }
};

// node_modules/@aws-sdk/lib-dynamodb/dist-es/commands/ExecuteStatementCommand.js
var ExecuteStatementCommand2 = class extends DynamoDBDocumentClientCommand {
  constructor(input) {
    super();
    __publicField(this, "input");
    __publicField(this, "inputKeyNodes", {
      Parameters: ALL_MEMBERS
    });
    __publicField(this, "outputKeyNodes", {
      Items: {
        "*": ALL_VALUES
      },
      LastEvaluatedKey: ALL_VALUES
    });
    __publicField(this, "clientCommand");
    __publicField(this, "middlewareStack");
    this.input = input;
    this.clientCommand = new ExecuteStatementCommand(this.input);
    this.middlewareStack = this.clientCommand.middlewareStack;
  }
  resolveMiddleware(clientStack, configuration, options) {
    this.addMarshallingMiddleware(configuration);
    const stack = clientStack.concat(this.middlewareStack);
    const handler = this.clientCommand.resolveMiddleware(stack, configuration, options);
    return async () => handler(this.clientCommand);
  }
};

// node_modules/@aws-sdk/lib-dynamodb/dist-es/commands/ExecuteTransactionCommand.js
var ExecuteTransactionCommand2 = class extends DynamoDBDocumentClientCommand {
  constructor(input) {
    super();
    __publicField(this, "input");
    __publicField(this, "inputKeyNodes", {
      TransactStatements: {
        "*": {
          Parameters: ALL_MEMBERS
        }
      }
    });
    __publicField(this, "outputKeyNodes", {
      Responses: {
        "*": {
          Item: ALL_VALUES
        }
      }
    });
    __publicField(this, "clientCommand");
    __publicField(this, "middlewareStack");
    this.input = input;
    this.clientCommand = new ExecuteTransactionCommand(this.input);
    this.middlewareStack = this.clientCommand.middlewareStack;
  }
  resolveMiddleware(clientStack, configuration, options) {
    this.addMarshallingMiddleware(configuration);
    const stack = clientStack.concat(this.middlewareStack);
    const handler = this.clientCommand.resolveMiddleware(stack, configuration, options);
    return async () => handler(this.clientCommand);
  }
};

// node_modules/@aws-sdk/lib-dynamodb/dist-es/commands/GetCommand.js
var GetCommand = class extends DynamoDBDocumentClientCommand {
  constructor(input) {
    super();
    __publicField(this, "input");
    __publicField(this, "inputKeyNodes", {
      Key: ALL_VALUES
    });
    __publicField(this, "outputKeyNodes", {
      Item: ALL_VALUES
    });
    __publicField(this, "clientCommand");
    __publicField(this, "middlewareStack");
    this.input = input;
    this.clientCommand = new GetItemCommand(this.input);
    this.middlewareStack = this.clientCommand.middlewareStack;
  }
  resolveMiddleware(clientStack, configuration, options) {
    this.addMarshallingMiddleware(configuration);
    const stack = clientStack.concat(this.middlewareStack);
    const handler = this.clientCommand.resolveMiddleware(stack, configuration, options);
    return async () => handler(this.clientCommand);
  }
};

// node_modules/@aws-sdk/lib-dynamodb/dist-es/commands/PutCommand.js
var PutCommand = class extends DynamoDBDocumentClientCommand {
  constructor(input) {
    super();
    __publicField(this, "input");
    __publicField(this, "inputKeyNodes", {
      Item: ALL_VALUES,
      Expected: {
        "*": {
          Value: SELF,
          AttributeValueList: ALL_MEMBERS
        }
      },
      ExpressionAttributeValues: ALL_VALUES
    });
    __publicField(this, "outputKeyNodes", {
      Attributes: ALL_VALUES,
      ItemCollectionMetrics: {
        ItemCollectionKey: ALL_VALUES
      }
    });
    __publicField(this, "clientCommand");
    __publicField(this, "middlewareStack");
    this.input = input;
    this.clientCommand = new PutItemCommand(this.input);
    this.middlewareStack = this.clientCommand.middlewareStack;
  }
  resolveMiddleware(clientStack, configuration, options) {
    this.addMarshallingMiddleware(configuration);
    const stack = clientStack.concat(this.middlewareStack);
    const handler = this.clientCommand.resolveMiddleware(stack, configuration, options);
    return async () => handler(this.clientCommand);
  }
};

// node_modules/@aws-sdk/lib-dynamodb/dist-es/commands/QueryCommand.js
var QueryCommand2 = class extends DynamoDBDocumentClientCommand {
  constructor(input) {
    super();
    __publicField(this, "input");
    __publicField(this, "inputKeyNodes", {
      KeyConditions: {
        "*": {
          AttributeValueList: ALL_MEMBERS
        }
      },
      QueryFilter: {
        "*": {
          AttributeValueList: ALL_MEMBERS
        }
      },
      ExclusiveStartKey: ALL_VALUES,
      ExpressionAttributeValues: ALL_VALUES
    });
    __publicField(this, "outputKeyNodes", {
      Items: {
        "*": ALL_VALUES
      },
      LastEvaluatedKey: ALL_VALUES
    });
    __publicField(this, "clientCommand");
    __publicField(this, "middlewareStack");
    this.input = input;
    this.clientCommand = new QueryCommand(this.input);
    this.middlewareStack = this.clientCommand.middlewareStack;
  }
  resolveMiddleware(clientStack, configuration, options) {
    this.addMarshallingMiddleware(configuration);
    const stack = clientStack.concat(this.middlewareStack);
    const handler = this.clientCommand.resolveMiddleware(stack, configuration, options);
    return async () => handler(this.clientCommand);
  }
};

// node_modules/@aws-sdk/lib-dynamodb/dist-es/commands/ScanCommand.js
var ScanCommand2 = class extends DynamoDBDocumentClientCommand {
  constructor(input) {
    super();
    __publicField(this, "input");
    __publicField(this, "inputKeyNodes", {
      ScanFilter: {
        "*": {
          AttributeValueList: ALL_MEMBERS
        }
      },
      ExclusiveStartKey: ALL_VALUES,
      ExpressionAttributeValues: ALL_VALUES
    });
    __publicField(this, "outputKeyNodes", {
      Items: {
        "*": ALL_VALUES
      },
      LastEvaluatedKey: ALL_VALUES
    });
    __publicField(this, "clientCommand");
    __publicField(this, "middlewareStack");
    this.input = input;
    this.clientCommand = new ScanCommand(this.input);
    this.middlewareStack = this.clientCommand.middlewareStack;
  }
  resolveMiddleware(clientStack, configuration, options) {
    this.addMarshallingMiddleware(configuration);
    const stack = clientStack.concat(this.middlewareStack);
    const handler = this.clientCommand.resolveMiddleware(stack, configuration, options);
    return async () => handler(this.clientCommand);
  }
};

// node_modules/@aws-sdk/lib-dynamodb/dist-es/commands/TransactGetCommand.js
var TransactGetCommand = class extends DynamoDBDocumentClientCommand {
  constructor(input) {
    super();
    __publicField(this, "input");
    __publicField(this, "inputKeyNodes", {
      TransactItems: {
        "*": {
          Get: {
            Key: ALL_VALUES
          }
        }
      }
    });
    __publicField(this, "outputKeyNodes", {
      Responses: {
        "*": {
          Item: ALL_VALUES
        }
      }
    });
    __publicField(this, "clientCommand");
    __publicField(this, "middlewareStack");
    this.input = input;
    this.clientCommand = new TransactGetItemsCommand(this.input);
    this.middlewareStack = this.clientCommand.middlewareStack;
  }
  resolveMiddleware(clientStack, configuration, options) {
    this.addMarshallingMiddleware(configuration);
    const stack = clientStack.concat(this.middlewareStack);
    const handler = this.clientCommand.resolveMiddleware(stack, configuration, options);
    return async () => handler(this.clientCommand);
  }
};

// node_modules/@aws-sdk/lib-dynamodb/dist-es/commands/TransactWriteCommand.js
var TransactWriteCommand = class extends DynamoDBDocumentClientCommand {
  constructor(input) {
    super();
    __publicField(this, "input");
    __publicField(this, "inputKeyNodes", {
      TransactItems: {
        "*": {
          ConditionCheck: {
            Key: ALL_VALUES,
            ExpressionAttributeValues: ALL_VALUES
          },
          Put: {
            Item: ALL_VALUES,
            ExpressionAttributeValues: ALL_VALUES
          },
          Delete: {
            Key: ALL_VALUES,
            ExpressionAttributeValues: ALL_VALUES
          },
          Update: {
            Key: ALL_VALUES,
            ExpressionAttributeValues: ALL_VALUES
          }
        }
      }
    });
    __publicField(this, "outputKeyNodes", {
      ItemCollectionMetrics: {
        "*": {
          "*": {
            ItemCollectionKey: ALL_VALUES
          }
        }
      }
    });
    __publicField(this, "clientCommand");
    __publicField(this, "middlewareStack");
    this.input = input;
    this.clientCommand = new TransactWriteItemsCommand(this.input);
    this.middlewareStack = this.clientCommand.middlewareStack;
  }
  resolveMiddleware(clientStack, configuration, options) {
    this.addMarshallingMiddleware(configuration);
    const stack = clientStack.concat(this.middlewareStack);
    const handler = this.clientCommand.resolveMiddleware(stack, configuration, options);
    return async () => handler(this.clientCommand);
  }
};

// node_modules/@aws-sdk/lib-dynamodb/dist-es/commands/UpdateCommand.js
var UpdateCommand = class extends DynamoDBDocumentClientCommand {
  constructor(input) {
    super();
    __publicField(this, "input");
    __publicField(this, "inputKeyNodes", {
      Key: ALL_VALUES,
      AttributeUpdates: {
        "*": {
          Value: SELF
        }
      },
      Expected: {
        "*": {
          Value: SELF,
          AttributeValueList: ALL_MEMBERS
        }
      },
      ExpressionAttributeValues: ALL_VALUES
    });
    __publicField(this, "outputKeyNodes", {
      Attributes: ALL_VALUES,
      ItemCollectionMetrics: {
        ItemCollectionKey: ALL_VALUES
      }
    });
    __publicField(this, "clientCommand");
    __publicField(this, "middlewareStack");
    this.input = input;
    this.clientCommand = new UpdateItemCommand(this.input);
    this.middlewareStack = this.clientCommand.middlewareStack;
  }
  resolveMiddleware(clientStack, configuration, options) {
    this.addMarshallingMiddleware(configuration);
    const stack = clientStack.concat(this.middlewareStack);
    const handler = this.clientCommand.resolveMiddleware(stack, configuration, options);
    return async () => handler(this.clientCommand);
  }
};

// node_modules/@aws-sdk/lib-dynamodb/dist-es/DynamoDBDocumentClient.js
var DynamoDBDocumentClient = class _DynamoDBDocumentClient extends Client {
  constructor(client, translateConfig) {
    var _a;
    super(client.config);
    __publicField(this, "config");
    this.config = client.config;
    this.config.translateConfig = translateConfig;
    this.middlewareStack = client.middlewareStack;
    if ((_a = this.config) == null ? void 0 : _a.cacheMiddleware) {
      throw new Error("@aws-sdk/lib-dynamodb - cacheMiddleware=true is not compatible with the DynamoDBDocumentClient. This option must be set to false.");
    }
  }
  static from(client, translateConfig) {
    return new _DynamoDBDocumentClient(client, translateConfig);
  }
  destroy() {
  }
};

// node_modules/@aws-sdk/lib-dynamodb/dist-es/DynamoDBDocument.js
var DynamoDBDocument = class _DynamoDBDocument extends DynamoDBDocumentClient {
  static from(client, translateConfig) {
    return new _DynamoDBDocument(client, translateConfig);
  }
  batchExecuteStatement(args, optionsOrCb, cb) {
    const command = new BatchExecuteStatementCommand2(args);
    if (typeof optionsOrCb === "function") {
      this.send(command, optionsOrCb);
    } else if (typeof cb === "function") {
      if (typeof optionsOrCb !== "object") {
        throw new Error(`Expect http options but get ${typeof optionsOrCb}`);
      }
      this.send(command, optionsOrCb || {}, cb);
    } else {
      return this.send(command, optionsOrCb);
    }
  }
  batchGet(args, optionsOrCb, cb) {
    const command = new BatchGetCommand(args);
    if (typeof optionsOrCb === "function") {
      this.send(command, optionsOrCb);
    } else if (typeof cb === "function") {
      if (typeof optionsOrCb !== "object") {
        throw new Error(`Expect http options but get ${typeof optionsOrCb}`);
      }
      this.send(command, optionsOrCb || {}, cb);
    } else {
      return this.send(command, optionsOrCb);
    }
  }
  batchWrite(args, optionsOrCb, cb) {
    const command = new BatchWriteCommand(args);
    if (typeof optionsOrCb === "function") {
      this.send(command, optionsOrCb);
    } else if (typeof cb === "function") {
      if (typeof optionsOrCb !== "object") {
        throw new Error(`Expect http options but get ${typeof optionsOrCb}`);
      }
      this.send(command, optionsOrCb || {}, cb);
    } else {
      return this.send(command, optionsOrCb);
    }
  }
  delete(args, optionsOrCb, cb) {
    const command = new DeleteCommand(args);
    if (typeof optionsOrCb === "function") {
      this.send(command, optionsOrCb);
    } else if (typeof cb === "function") {
      if (typeof optionsOrCb !== "object") {
        throw new Error(`Expect http options but get ${typeof optionsOrCb}`);
      }
      this.send(command, optionsOrCb || {}, cb);
    } else {
      return this.send(command, optionsOrCb);
    }
  }
  executeStatement(args, optionsOrCb, cb) {
    const command = new ExecuteStatementCommand2(args);
    if (typeof optionsOrCb === "function") {
      this.send(command, optionsOrCb);
    } else if (typeof cb === "function") {
      if (typeof optionsOrCb !== "object") {
        throw new Error(`Expect http options but get ${typeof optionsOrCb}`);
      }
      this.send(command, optionsOrCb || {}, cb);
    } else {
      return this.send(command, optionsOrCb);
    }
  }
  executeTransaction(args, optionsOrCb, cb) {
    const command = new ExecuteTransactionCommand2(args);
    if (typeof optionsOrCb === "function") {
      this.send(command, optionsOrCb);
    } else if (typeof cb === "function") {
      if (typeof optionsOrCb !== "object") {
        throw new Error(`Expect http options but get ${typeof optionsOrCb}`);
      }
      this.send(command, optionsOrCb || {}, cb);
    } else {
      return this.send(command, optionsOrCb);
    }
  }
  get(args, optionsOrCb, cb) {
    const command = new GetCommand(args);
    if (typeof optionsOrCb === "function") {
      this.send(command, optionsOrCb);
    } else if (typeof cb === "function") {
      if (typeof optionsOrCb !== "object") {
        throw new Error(`Expect http options but get ${typeof optionsOrCb}`);
      }
      this.send(command, optionsOrCb || {}, cb);
    } else {
      return this.send(command, optionsOrCb);
    }
  }
  put(args, optionsOrCb, cb) {
    const command = new PutCommand(args);
    if (typeof optionsOrCb === "function") {
      this.send(command, optionsOrCb);
    } else if (typeof cb === "function") {
      if (typeof optionsOrCb !== "object") {
        throw new Error(`Expect http options but get ${typeof optionsOrCb}`);
      }
      this.send(command, optionsOrCb || {}, cb);
    } else {
      return this.send(command, optionsOrCb);
    }
  }
  query(args, optionsOrCb, cb) {
    const command = new QueryCommand2(args);
    if (typeof optionsOrCb === "function") {
      this.send(command, optionsOrCb);
    } else if (typeof cb === "function") {
      if (typeof optionsOrCb !== "object") {
        throw new Error(`Expect http options but get ${typeof optionsOrCb}`);
      }
      this.send(command, optionsOrCb || {}, cb);
    } else {
      return this.send(command, optionsOrCb);
    }
  }
  scan(args, optionsOrCb, cb) {
    const command = new ScanCommand2(args);
    if (typeof optionsOrCb === "function") {
      this.send(command, optionsOrCb);
    } else if (typeof cb === "function") {
      if (typeof optionsOrCb !== "object") {
        throw new Error(`Expect http options but get ${typeof optionsOrCb}`);
      }
      this.send(command, optionsOrCb || {}, cb);
    } else {
      return this.send(command, optionsOrCb);
    }
  }
  transactGet(args, optionsOrCb, cb) {
    const command = new TransactGetCommand(args);
    if (typeof optionsOrCb === "function") {
      this.send(command, optionsOrCb);
    } else if (typeof cb === "function") {
      if (typeof optionsOrCb !== "object") {
        throw new Error(`Expect http options but get ${typeof optionsOrCb}`);
      }
      this.send(command, optionsOrCb || {}, cb);
    } else {
      return this.send(command, optionsOrCb);
    }
  }
  transactWrite(args, optionsOrCb, cb) {
    const command = new TransactWriteCommand(args);
    if (typeof optionsOrCb === "function") {
      this.send(command, optionsOrCb);
    } else if (typeof cb === "function") {
      if (typeof optionsOrCb !== "object") {
        throw new Error(`Expect http options but get ${typeof optionsOrCb}`);
      }
      this.send(command, optionsOrCb || {}, cb);
    } else {
      return this.send(command, optionsOrCb);
    }
  }
  update(args, optionsOrCb, cb) {
    const command = new UpdateCommand(args);
    if (typeof optionsOrCb === "function") {
      this.send(command, optionsOrCb);
    } else if (typeof cb === "function") {
      if (typeof optionsOrCb !== "object") {
        throw new Error(`Expect http options but get ${typeof optionsOrCb}`);
      }
      this.send(command, optionsOrCb || {}, cb);
    } else {
      return this.send(command, optionsOrCb);
    }
  }
};

// node_modules/@aws-sdk/lib-dynamodb/dist-es/pagination/QueryPaginator.js
var paginateQuery = createPaginator(DynamoDBDocumentClient, QueryCommand2, "ExclusiveStartKey", "LastEvaluatedKey", "Limit");

// node_modules/@aws-sdk/lib-dynamodb/dist-es/pagination/ScanPaginator.js
var paginateScan = createPaginator(DynamoDBDocumentClient, ScanCommand2, "ExclusiveStartKey", "LastEvaluatedKey", "Limit");
export {
  Command as $Command,
  BatchExecuteStatementCommand2 as BatchExecuteStatementCommand,
  BatchGetCommand,
  BatchWriteCommand,
  DeleteCommand,
  DynamoDBDocument,
  DynamoDBDocumentClient,
  DynamoDBDocumentClientCommand,
  ExecuteStatementCommand2 as ExecuteStatementCommand,
  ExecuteTransactionCommand2 as ExecuteTransactionCommand,
  GetCommand,
  NumberValue,
  PutCommand,
  QueryCommand2 as QueryCommand,
  ScanCommand2 as ScanCommand,
  TransactGetCommand,
  TransactWriteCommand,
  UpdateCommand,
  Client as __Client,
  paginateQuery,
  paginateScan
};
//# sourceMappingURL=@aws-sdk_lib-dynamodb.js.map
