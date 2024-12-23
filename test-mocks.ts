// mocked user object returned by the kinde api
export const mockUser = {
  id: "quack",
  given_name: "Nekita",
  family_name: "Quack",
  email: "quack@example.com",
  picture: "https://example.com/avatar.jpg",
} as const;

// mocked existing user in the database
export const mockExistingUser = {
  id: "foo",
  auth_user_id: "SgDa2xZs47ojqwo0C",
  email: "money-grubbing_advaith@gmx.de",
  display_name: "Rianna",
  created_at: "2023-01-10T00:24:13.000Z",
  updated_at: "2023-01-10T00:24:13.000Z",
} as const;
