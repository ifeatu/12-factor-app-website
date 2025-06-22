# Factor 13: API First

## Design and document APIs before implementation

### Modern Principle

Modern applications live or die by their APIs. API-first design means defining the interface before implementation, enabling parallel development, clear contracts between services, and better developer experience. This factor addresses a gap in the original twelve - the critical importance of well-designed, documented, and versioned APIs.

#### Why API First?

- **Parallel Development**: Frontend and backend teams can work simultaneously
- **Contract Testing**: Ensure compatibility before deployment
- **Documentation**: Generated from specifications
- **Mock Servers**: Test against APIs before they exist
- **Client Generation**: Auto-generate SDKs in multiple languages

#### OpenAPI Specification

```yaml
# api-spec.yaml
openapi: 3.0.3
info:
  title: User Service API
  version: 1.0.0
  description: |
    User management service providing authentication and profile management
servers:
  - url: https://api.example.com/v1
    description: Production
  - url: https://staging-api.example.com/v1
    description: Staging

paths:
  /users:
    post:
      summary: Create a new user
      operationId: createUser
      tags:
        - Users
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateUserRequest'
      responses:
        '201':
          description: User created successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
          headers:
            Location:
              schema:
                type: string
              description: URL of the created user
        '400':
          $ref: '#/components/responses/BadRequest'
        '409':
          $ref: '#/components/responses/Conflict'

  /users/{userId}:
    get:
      summary: Get user by ID
      operationId: getUser
      tags:
        - Users
      parameters:
        - $ref: '#/components/parameters/userId'
      responses:
        '200':
          description: User found
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
        '404':
          $ref: '#/components/responses/NotFound'

components:
  schemas:
    User:
      type: object
      required:
        - id
        - email
        - createdAt
      properties:
        id:
          type: string
          format: uuid
          example: "123e4567-e89b-12d3-a456-426614174000"
        email:
          type: string
          format: email
          example: "user@example.com"
        name:
          type: string
          example: "John Doe"
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time

    CreateUserRequest:
      type: object
      required:
        - email
      properties:
        email:
          type: string
          format: email
        name:
          type: string

  parameters:
    userId:
      name: userId
      in: path
      required: true
      schema:
        type: string
        format: uuid

  responses:
    BadRequest:
      description: Bad request
      content:
        application/json:
          schema:
            type: object
            properties:
              error:
                type: string
              message:
                type: string
    
    NotFound:
      description: Resource not found
      content:
        application/json:
          schema:
            type: object
            properties:
              error:
                type: string
              message:
                type: string
    
    Conflict:
      description: Resource already exists
      content:
        application/json:
          schema:
            type: object
            properties:
              error:
                type: string
              message:
                type: string
```

#### GraphQL Schema First

```graphql
# schema.graphql
type Query {
  user(id: ID!): User
  users(filter: UserFilter, pagination: PaginationInput): UserConnection!
}

type Mutation {
  createUser(input: CreateUserInput!): CreateUserPayload!
  updateUser(id: ID!, input: UpdateUserInput!): UpdateUserPayload!
  deleteUser(id: ID!): DeleteUserPayload!
}

type User {
  id: ID!
  email: String!
  name: String
  posts: PostConnection!
  createdAt: DateTime!
  updatedAt: DateTime!
}

input CreateUserInput {
  email: String!
  name: String
  password: String!
}

type CreateUserPayload {
  user: User
  errors: [UserError!]
}

type UserError {
  field: String
  message: String!
}
```

#### gRPC Protocol Buffers

```protobuf
// user.proto
syntax = "proto3";

package user.v1;

import "google/protobuf/timestamp.proto";
import "google/protobuf/empty.proto";

service UserService {
  rpc CreateUser(CreateUserRequest) returns (User);
  rpc GetUser(GetUserRequest) returns (User);
  rpc UpdateUser(UpdateUserRequest) returns (User);
  rpc DeleteUser(DeleteUserRequest) returns (google.protobuf.Empty);
  rpc ListUsers(ListUsersRequest) returns (ListUsersResponse);
}

message User {
  string id = 1;
  string email = 2;
  string name = 3;
  google.protobuf.Timestamp created_at = 4;
  google.protobuf.Timestamp updated_at = 5;
}

message CreateUserRequest {
  string email = 1;
  string name = 2;
  string password = 3;
}
```

### Implementation Guidelines

1. **Design First Workflow**
    
    ```bash
    # 1. Write API specification
    vim api/openapi.yaml
    
    # 2. Validate specification
    openapi-generator validate -i api/openapi.yaml
    
    # 3. Generate mock server
    prism mock api/openapi.yaml
    
    # 4. Generate server stubs
    openapi-generator generate -i api/openapi.yaml \
      -g python-fastapi -o ./server
    
    # 5. Generate client SDKs
    openapi-generator generate -i api/openapi.yaml \
      -g typescript-axios -o ./client-ts
    ```
    
2. **Contract Testing**
    
    ```javascript
    // Pact consumer test
    const { pactWith } = require('jest-pact');
    
    pactWith({ consumer: 'Frontend', provider: 'UserService' }, provider => {
      describe('User API', () => {
        test('get user by ID', async () => {
          await provider.addInteraction({
            state: 'User 123 exists',
            uponReceiving: 'a request for user 123',
            withRequest: {
              method: 'GET',
              path: '/users/123',
            },
            willRespondWith: {
              status: 200,
              body: {
                id: '123',
                email: 'test@example.com',
                name: 'Test User'
              },
            },
          });
          
          const user = await getUserById('123');
          expect(user.email).toBe('test@example.com');
        });
      });
    });
    ```
    
3. **API Versioning**
    
    ```python
    # URL versioning
    @app.route('/v1/users/<user_id>')
    def get_user_v1(user_id):
        # Original implementation
        pass
    
    @app.route('/v2/users/<user_id>')
    def get_user_v2(user_id):
        # Enhanced implementation with breaking changes
        pass
    
    # Header versioning
    @app.route('/users/<user_id>')
    def get_user(user_id):
        version = request.headers.get('API-Version', 'v1')
        if version == 'v2':
            return get_user_v2_logic(user_id)
        return get_user_v1_logic(user_id)
    ```
    

### Best Practices

1. **Comprehensive Documentation**
    
    - Examples for every endpoint
    - Error scenarios and codes
    - Rate limiting information
    - Authentication requirements
2. **Backward Compatibility**
    
    - Never remove fields
    - Mark deprecated fields
    - Provide migration guides
    - Support multiple versions
3. **Developer Experience**
    
    - Interactive documentation
    - SDK generation
    - Sandbox environments
    - Clear error messages

### Key Takeaways

- APIs are contracts between services
- Design before implementation enables parallel development
- Documentation and testing are first-class concerns
- Versioning strategy prevents breaking changes
- Developer experience drives adoption

---

### Sources

- `https://swagger.io/specification/`
- `https://graphql.org/learn/schema/`
- `https://grpc.io/docs/what-is-grpc/introduction/`
```