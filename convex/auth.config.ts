import { authKit } from "./auth";

const authConfig = {
  providers: authKit.getAuthConfigProviders(),
};

export default authConfig;
