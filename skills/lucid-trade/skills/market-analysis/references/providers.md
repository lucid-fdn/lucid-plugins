# Market Data & DEX Providers

API reference for supported data providers and decentralized exchanges.

## Supported Chains

| Chain | Chain ID | Token Decimals |
|-------|----------|---------------|
| ethereum | 1 | 18 (ETH/ERC-20) |
| solana | solana | 6 (SPL tokens) |
| bsc | 56 | 18 (BEP-20) |
| arbitrum | 42161 | 18 |
| base | 8453 | 18 |
| polygon | 137 | 18 |

## Jupiter (Solana DEX Aggregator)

- **Base URL**: `https://quote-api.jup.ag/v6`
- **Chains**: solana only
- **Auth**: API key optional (improves rate limits)

### Get Quote

```
GET /quote?inputMint={fromToken}&outputMint={toToken}&amount={lamports}&slippageBps={slippage}
```

- `amount`: In **lamports** (multiply token amount by 1e6)
- `slippageBps`: Slippage in **basis points** (0.5% = 50 bps)
- Response fields: `outAmount` (string, in lamports), `priceImpactPct` (string), `routePlan` (array of swap steps)
- Convert output: `parseInt(outAmount) / 1e6`

### Execute Swap

After getting a quote, submit to `/swap` endpoint with the quote response and user's public key. The API returns a serialized transaction to sign and submit on-chain.

## 1inch (EVM DEX Aggregator)

- **Base URL**: `https://api.1inch.dev/swap/v6.0/{chainId}`
- **Chains**: ethereum (1), bsc (56), polygon (137), arbitrum (42161), base (8453)
- **Auth**: Required. Header `Authorization: Bearer {API_KEY}`

### Get Quote

```
GET /{chainId}/quote?src={fromToken}&dst={toToken}&amount={wei}
```

- `amount`: In **wei** (multiply token amount by 1e18)
- Response fields: `toAmount` (string, in wei), `protocols` (route info), `gas` (estimated gas units)
- Convert output: `parseInt(toAmount) / 1e18`

### Execute Swap

```
GET /{chainId}/swap?src={fromToken}&dst={toToken}&amount={wei}&from={walletAddress}&slippage={pct}
```

- `slippage`: As percentage (e.g., 0.5 for 0.5%)
- Returns transaction data (to, data, value, gas) to sign and broadcast

## Birdeye (Market Data Provider)

- **Base URL**: `https://public-api.birdeye.so`
- **Chains**: solana, ethereum, bsc, arbitrum, base, polygon
- **Auth**: Required. Header `X-API-KEY: {API_KEY}`, `x-chain: {chain}`

### Get Price

```
GET /defi/price?address={tokenAddress}
```

- Response: `data.value` (current price in USD), `data.updateUnixTime` (timestamp)

### Get OHLCV

```
GET /defi/ohlcv?address={tokenAddress}&type={timeframe}&limit={count}
```

- Timeframes: `1m`, `5m`, `15m`, `1H`, `4H`, `1D`, `1W`
- Note the capitalization: minutes are lowercase, hours/days/weeks are uppercase
- Response: `data.items[]` with fields `unixTime`, `o` (open), `h` (high), `l` (low), `c` (close), `v` (volume)
- Timestamps are Unix seconds (multiply by 1000 for milliseconds)

### Timeframe Mapping

| User Input | Birdeye API |
|-----------|-------------|
| 1m | 1m |
| 5m | 5m |
| 15m | 15m |
| 1h | 1H |
| 4h | 4H |
| 1d | 1D |
| 1w | 1W |
