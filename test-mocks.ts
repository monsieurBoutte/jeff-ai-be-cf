// mocked user object returned by the kinde api
export const mockUser = {
  id: "foo",
  given_name: "Test",
  family_name: "User",
  email: "test@example.com",
  picture: "https://example.com/avatar.jpg",
} as const;

// mocked existing user in the database
export const mockExistingUser = {
  id: "rqdz7DFTENMnujlyC",
  auth_user_id: "adIL75L1Vp",
  email: "rented_murad@hotmail.fr",
  display_name: "Nekita",
  created_at: "2023-01-10T00:24:13.000Z",
  updated_at: "2023-01-10T00:24:13.000Z",
} as const;
