import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import {
  actionSpecOpenApiPostRequestBody,
  actionsSpecOpenApiGetResponse,
  actionsSpecOpenApiPostResponse,
} from '../openapi';
import { Connection, PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider, BN } from '@coral-xyz/anchor';
import * as Idl from '../../../lst-hook/target/idl/lst_game.json';
import { LstGame } from '../../../lst-hook/target/types/lst_game';
import { getAssociatedTokenAddressSync, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import sharp from 'sharp';
import { createCanvas, loadImage, registerFont } from 'canvas';
import fetch from 'node-fetch';
import { createHash } from 'crypto';


import { createNoise2D } from 'simplex-noise';
import { ActionGetResponse, ActionPostResponse } from '@solana/actions';

const programId = new PublicKey('5bvBLwBoMJs4s7gkdRsNdayr4MVvzLTznzEN3YxZAAvm');

const app = new OpenAPIHono();
import { createCanvas, loadImage, registerFont } from 'canvas';
import fetch from 'node-fetch';
import { createHash } from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';

// ... other imports ...

async function fetchFontBuffer(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch font: ${response.statusText}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

async function generateLeaderboardImage(gameState: any, totalSol: number, totalSupply: number) {
  const fontUrl = 'https://assets.codepen.io/2585/Cyberpunk-Regular.ttf';
  const fontBuffer = await fetchFontBuffer(fontUrl);

  // Generate a unique identifier for the font
  const fontHash = createHash('md5').update(fontBuffer).digest('hex');
  const fontFamily = `CyberpunkFont-${fontHash}`;

  // Create a temporary file for the font
  const tempDir = os.tmpdir();
  const tempFontPath = path.join(tempDir, `${fontFamily}.ttf`);

  // Write the font buffer to the temporary file
  fs.writeFileSync(tempFontPath, fontBuffer);

  // Register the font using the temporary file
  registerFont(tempFontPath, { family: fontFamily });

  const width = 1000;
  const height = 800;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Create a cyberpunk-style background
  const noise2D = createNoise2D();
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      const value = noise2D(x / 100, y / 100);
      const r = Math.floor((value + 1) * 64);
      const g = Math.floor((value + 1) * 32);
      const b = Math.floor((value + 1) * 128);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }

  // Add a glowing effect
  ctx.shadowColor = '#00ffff';
  ctx.shadowBlur = 20;

  // Draw a stylized "CG" text instead of logo
  ctx.font = `bold 120px "${fontFamily}"`;
  ctx.fillStyle = '#ff00ff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('CG', 125, 125);

  // Set text styles for title
  ctx.font = '60px CyberpunkFont';
  ctx.fillStyle = '#ff00ff';
  ctx.textAlign = 'center';

  // Draw title
  ctx.fillText('CRASH GAME', width / 2, 100);
  ctx.font = '40px CyberpunkFont';
  ctx.fillText('LEADERBOARD', width / 2, 170);
  // Draw game state info
  ctx.font = '36px CyberpunkFont';
  ctx.fillStyle = '#00ffff';
  ctx.textAlign = 'left';

  const yieldRate = gameState.currentYieldRate;
  const infoLines = [
    `Current Yield Rate: ${yieldRate.toFixed(2)}% 🚀`,
    `Total Supply: ${(totalSupply / 1e9).toFixed(2)} tokens 💎`,
    `Total SOL: ${(totalSol / 1e9).toFixed(2)} SOL 🌞`,
    `Crash Time: ${new Date(gameState.isCrashed.toNumber() * 1000).toLocaleString()} ⏰`,
  ];

  infoLines.forEach((line, index) => {
    ctx.fillText(line, 50, 300 + index * 60);
  });

  // Add some ridiculous motivational quotes
  const quotes = [
    "HODL like your life depends on it! 💪",
    "When in doubt, zoom out... of reality! 🌌",
    "Buy high, sell higher! This is financial advice* 📈",
    "1 CRASHY = 1 CRASHY (but also maybe 1,000,000 SOL) 🤑",
  ];

  ctx.font = '24px CyberpunkFont';
  ctx.fillStyle = '#ff69b4';
  quotes.forEach((quote, index) => {
    ctx.fillText(quote, 50, 600 + index * 40);
  });

  ctx.font = '18px CyberpunkFont';
  ctx.fillText("*Not actually financial advice. Please don't sue us.", 50, 780);

  // Convert canvas to buffer
  const buffer = canvas.toBuffer('image/png');

  // Use sharp to add some effects
  const finalImage = await sharp(buffer)
  .blur(0.5)
  .modulate({ brightness: 1.2, saturation: 1.5 })
  .composite([{
    input: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><filter id="dropShadow"><feDropShadow dx="0" dy="0" stdDeviation="10" flood-color="#ff00ff"/></filter><rect width="100%" height="100%" filter="url(#dropShadow)"/></svg>'),
    blend: 'over'
  }])
  .toBuffer();
fs.unlinkSync(tempFontPath);

  return 'data:image/png;base64,' + finalImage.toString('base64');
}


app.openapi(
  createRoute({
    method: 'get',
    path: '/',
    tags: ['Crash Game'],
    responses: actionsSpecOpenApiGetResponse,
  }),
  async (c) => {
    const connection = new Connection(process.env.NEXT_PUBLIC_MAINNET_RPC_URL as string, "processed");
    const provider = new AnchorProvider(connection, {} as any, {});
    const program = new Program<LstGame>(Idl as any, provider);

    const [gameAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from('game')],
      program.programId
    );

    const gameState = await program.account.game.fetch(gameAccount);
    const totalSol = await connection.getBalance(gameAccount);
    const mintInfo = await connection.getTokenSupply(gameState.mint);
    const totalSupply = Number(mintInfo.value.amount);
const amountParameterName = 'amount';
    const response: ActionGetResponse = {
      icon: await generateLeaderboardImage(gameState, totalSol, totalSupply),
      label: 'Crash Game',
      title: 'Crash Game',
      description: `Mint tokens, stake them, and try to cash out before the game crashes!
        Current Yield Rate: ${gameState.currentYieldRate }%
        Total Supply: ${totalSupply / 1e9} tokens
        Total SOL: ${totalSol / 1e9} SOL`,
      links: {
        actions: [
          {
            label: 'Mint 1 SOL',
            href: '/mint/1',
          },
          {
            label: 'Mint 2 SOL',
            href: '/mint/2',
          },
          {
            label: 'Mint 5 SOL',
            href: '/mint/5',
          },
          {
            label: 'Mint Custom Amount',
            href: `/mint/{${amountParameterName}}`,
            parameters: [
              {
                name: amountParameterName,
                label: 'Enter custom SOL amount',
              },
            ],
          },
          {
            label: 'Stake All',
            href: '/stake-all',
          },
          {
            label: 'Cash Out',
            href: '/cashout',
          },
          {
            label: 'Burn All for SOL',
            href: '/burn-all',
          },
        ],
      },
    };

    return c.json(response);
  },
);

app.openapi(
  createRoute({
    method: 'post',
    path: '/mint/{amount}',
    tags: ['Crash Game'],
    request: {
      params: z.object({
        amount: z.string().regex(/^\d+(\.\d+)?$/).transform(Number),
      }),
      body: actionSpecOpenApiPostRequestBody,
    },
    responses: actionsSpecOpenApiPostResponse,
  }),
  async (c) => {
    const amount = Number(c.req.param('amount'));
    const { account } = await c.req.json();

    const connection = new Connection(process.env.NEXT_PUBLIC_MAINNET_RPC_URL as string, "processed");
    const provider = new AnchorProvider(connection, { publicKey: new PublicKey(account) } as any, {});
    const program = new Program<LstGame>(Idl as any, provider);

    const [gameAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from('game')],
      program.programId
    );

    const gameState = await program.account.game.fetch(gameAccount);
    const userTokenAccount = getAssociatedTokenAddressSync(gameState.mint, new PublicKey(account), false, TOKEN_2022_PROGRAM_ID);

    const tx = await program.methods.mintTokens(new BN(amount * 1e9))
      .accounts({
        user: new PublicKey(account),
        mint: gameState.mint,
        userTokenAccount,
        recentSlothashes: new PublicKey('SysvarS1otHashes111111111111111111111111111'),
      })
      .transaction();
tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash
tx.feePayer = new PublicKey(account)
    const response: ActionPostResponse = {
      transaction: tx.serialize({ requireAllSignatures: false }).toString('base64'),
    };

    return c.json(response);
  },
);
app.openapi(
  createRoute({
    method: 'post',
    path: '/burn-all',
    tags: ['Crash Game'],
    request: {
      body: actionSpecOpenApiPostRequestBody,
    },
    responses: actionsSpecOpenApiPostResponse,
  }),
  async (c) => {
    const { account } = await c.req.json();

    const connection = new Connection(process.env.NEXT_PUBLIC_MAINNET_RPC_URL as string, "processed");
    const provider = new AnchorProvider(connection, { publicKey: new PublicKey(account) } as any, {});
    const program = new Program<LstGame>(Idl as any, provider);

    const [gameAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from('game')],
      program.programId
    );

    const gameState = await program.account.game.fetch(gameAccount);
    const burnAccount = getAssociatedTokenAddressSync(gameState.mint, new PublicKey(account), false, TOKEN_2022_PROGRAM_ID);

    // Fetch the user's token balance
    const userTokenBalance = await connection.getTokenAccountBalance(burnAccount);
    const burnAmount = new BN(userTokenBalance.value.amount);
    const gameTokenAccount = getAssociatedTokenAddressSync(gameState.mint, gameAccount, true, TOKEN_2022_PROGRAM_ID);
    const tx = await program.methods.burn(burnAmount)
      .accounts({
        user: new PublicKey(account),
        mint: gameState.mint,
        burnAccount,
        recentSlothashes: new PublicKey('SysvarS1otHashes111111111111111111111111111'),
        hydraAccount: gameTokenAccount
      })
      .transaction();

    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    tx.feePayer = new PublicKey(account);

    const response: ActionPostResponse = {
      transaction: tx.serialize({ requireAllSignatures: false }).toString('base64'),
    };

    return c.json(response);
  },
);

app.openapi(
  createRoute({
    method: 'post',
    path: '/mint-custom',
    tags: ['Crash Game'],
    request: {
      // @ts-ignore
      body: z.object({
        account: z.string(),
        amount: z.number().positive(),
      }),
    },
    responses: actionsSpecOpenApiPostResponse,
  }),
  async (c) => {
    const { account, amount } = await c.req.json();

    const connection = new Connection(process.env.NEXT_PUBLIC_MAINNET_RPC_URL as string, "processed");
    const provider = new AnchorProvider(connection, { publicKey: new PublicKey(account) } as any, {});
    const program = new Program<LstGame>(Idl as any, provider);

    const [gameAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from('game')],
      program.programId
    );

    const gameState = await program.account.game.fetch(gameAccount);
    const userTokenAccount = getAssociatedTokenAddressSync(gameState.mint, new PublicKey(account), false, TOKEN_2022_PROGRAM_ID);

    const tx = await program.methods.mintTokens(new BN(amount * 1e9))
      .accounts({
        user: new PublicKey(account),
        mint: gameState.mint,
        userTokenAccount,
        recentSlothashes: new PublicKey('SysvarS1otHashes111111111111111111111111111'),
      })
      .transaction();
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash
    tx.feePayer = new PublicKey(account)
    const response: ActionPostResponse = {
      transaction: tx.serialize({ requireAllSignatures: false }).toString('base64'),
    };

    return c.json(response);
  },
);

app.openapi(
  createRoute({
    method: 'post',
    path: '/stake-all',
    tags: ['Crash Game'],
    request: {
      body: actionSpecOpenApiPostRequestBody,
    },
    responses: actionsSpecOpenApiPostResponse,
  }),
  async (c) => {
    const { account } = await c.req.json();

    const connection = new Connection(process.env.NEXT_PUBLIC_MAINNET_RPC_URL as string, "processed");
    const provider = new AnchorProvider(connection, { publicKey: new PublicKey(account) } as any, {});
    const program = new Program<LstGame>(Idl as any, provider);

    const [gameAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from('game')],
      program.programId
    );

    const gameState = await program.account.game.fetch(gameAccount);
    const userTokenAccount = getAssociatedTokenAddressSync(gameState.mint, new PublicKey(account), false, TOKEN_2022_PROGRAM_ID);
    const gameTokenAccount = getAssociatedTokenAddressSync(gameState.mint, gameAccount, true, TOKEN_2022_PROGRAM_ID);

    // Get the user's token balance
    const userTokenBalance = await connection.getTokenAccountBalance(userTokenAccount);
    const amountToStake = new BN(userTokenBalance.value.amount);

    const tx = await program.methods.stake(amountToStake)
      .accounts({
        payer: new PublicKey(account),
        mint: gameState.mint,
        userTokenAccount,
        gameTokenAccount,
        recentSlothashes: new PublicKey('SysvarS1otHashes111111111111111111111111111'),
      })
      .transaction();

    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash
    tx.feePayer = new PublicKey(account)
    const response: ActionPostResponse = {
      transaction: tx.serialize({ requireAllSignatures: false }).toString('base64'),
    };

    return c.json(response);
  },
);

app.openapi(
  createRoute({
    method: 'post',
    path: '/cashout',
    tags: ['Crash Game'],
    request: {
      body: actionSpecOpenApiPostRequestBody,
    },
    responses: actionsSpecOpenApiPostResponse,
  }),
  async (c) => {
    const { account } = await c.req.json();

    const connection = new Connection(process.env.NEXT_PUBLIC_MAINNET_RPC_URL as string, "processed");
    const provider = new AnchorProvider(connection, { publicKey: new PublicKey(account) } as any, {});
    const program = new Program<LstGame>(Idl as any, provider);

    const [gameAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from('game')],
      program.programId
    );

    const gameState = await program.account.game.fetch(gameAccount);
    const userTokenAccount = getAssociatedTokenAddressSync(gameState.mint, new PublicKey(account), false, TOKEN_2022_PROGRAM_ID);
    const gameTokenAccount = getAssociatedTokenAddressSync(gameState.mint, gameAccount, true, TOKEN_2022_PROGRAM_ID);
    const tx = await program.methods.cashOut()
      .accounts({
        payer: new PublicKey(account),
        mint: gameState.mint,
        userTokenAccount,
        gameTokenAccount,
        recentSlothashes: new PublicKey('SysvarS1otHashes111111111111111111111111111'),
      })
      .transaction();
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash
      tx.feePayer = new PublicKey(account)

    const response: ActionPostResponse = {
      transaction: tx.serialize({ requireAllSignatures: false }).toString('base64'),
    };

    return c.json(response);
  },
);

export default app;