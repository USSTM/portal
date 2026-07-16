import { getLiveness } from '../src/health.js'

export default () => Response.json(getLiveness())
