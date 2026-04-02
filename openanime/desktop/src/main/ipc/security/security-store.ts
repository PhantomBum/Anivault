import Store from "electron-store";

export type SecurityStoreSchema = {
  gateEnabled: boolean;
  salt: string;
  passcodeHash: string;
};

const defaults: SecurityStoreSchema = {
  gateEnabled: false,
  salt: "",
  passcodeHash: "",
};

export const securityStore = new Store<SecurityStoreSchema>({
  name: "anivault-security",
  defaults,
});
