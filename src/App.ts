import * as express from 'express';
import { Request, Response } from 'express-serve-static-core';


class App {
  public express;

  constructor() {
    this.express = express();
    const bodyParser = require('body-parser');
    this.express.use(bodyParser.json()); // support json encoded bodies
    this.express.use(bodyParser.urlencoded({ extended: true }));
    this.mountRoutes();
  }

  private splitString(value: string): Array<string> {
    const subStringValues: Array<string> = new Array();
    const subStr = (splitter, val) => {
      val.split(splitter).map((v, i) => {
        if (v.indexOf('0') < 0) {
          console.log(v);
          subStringValues.push(i === 0 ? `${v}${splitter}` : v);
          return;
        }
        const nextSplitter = splitter.slice(0, splitter.length - 1);
        if (v.split(nextSplitter).length > 1) {
          subStr(splitter.slice(0, splitter.length - 1), v);
        }
      });
    }

    subStr('0000', value);

    return subStringValues;
  }

  private buildV1Response(token: string): UserDetails {
    if (!token) {
      return null;
    }

    const subStringValues = this.splitString(token);

    const responseObj: UserDetails = new UserDetails({
      firstName: subStringValues[0],
      lastName: subStringValues[1],
      clientId: subStringValues[2]
    });

    console.log("Resp" + subStringValues);
    return responseObj;
  }

  private buildV2Response(token: string): UserDetails {
    if (!token) {
      return null;
    }

    const subStringValues = this.splitString(token);
    const removeZeros = (v: string) => v.replace(new RegExp('0', 'g'), '');
    const formatClientId = (v: string) =>
      `${v.slice(0, 3)}-${v.slice(3)}`;

    const responseObj: UserDetails = new UserDetails({
      firstName: removeZeros(subStringValues[0]),
      lastName: removeZeros(subStringValues[1]),
      clientId: formatClientId(subStringValues[2])
    });
    return responseObj;
  }

  private mountRoutes(): void {
    const router = express.Router();

    router.post('/api/v1/parse', (req: Request, res: Response) => {
      console.log("Request  " + JSON.stringify(req.body));
      const userToken: UserToken = req.body;
      res.json(new HttpResponse<UserDetails>({
        statusCode: 200,
        data: this.buildV1Response(userToken.data)
      }))
    })

    router.post('/api/v2/parse', (req: Request, res: Response) => {
      const userToken: UserToken = req.body;
      res.json(new HttpResponse<UserDetails>({
        statusCode: 200,
        data: this.buildV2Response(userToken.data)
      }));
    })

    this.express.use('/', router);
  }
}

interface UserToken {
  data: string;
}

class UserDetails {
  firstName: string;
  lastName: string;
  clientId: string;

  constructor(config?) {
    config = config || {};
    this.firstName = config.firstName;
    this.lastName = config.lastName;
    this.clientId = config.clientId;
  }
}

class HttpResponse<T> {
  statusCode: number;
  data: T;

  constructor(config?) {
    config = config || {};
    this.statusCode = config.statusCode;
    this.data = config.data
  }
}


export default new App().express;
