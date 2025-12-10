declare module "secret-santa-generator" {
  interface SecretSanta {
    buildSecretSantaTable: (participants: unknown[]) => Record<number, number>;
  }
  
  const secretSanta: SecretSanta;
  export default secretSanta;
}
