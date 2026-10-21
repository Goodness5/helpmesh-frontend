export type Snapshot = {
  balance: number
  poolBalance: number
  poolId: string
  faucetNext: number
  blockTimestamp: number
  forwarderNonce: string
  permitNonce: string
  escrowState: number
  tokenName: string
  tokenVersion: string
  forwarderName: string
  forwarderVersion: string
  chainId: number
  attestName: string
  attestVersion: string
}
