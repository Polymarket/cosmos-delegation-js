"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _axios = _interopRequireDefault(require("axios"));

var _big = _interopRequireDefault(require("big.js"));

var _ledgerCosmosJs = require("ledger-cosmos-js");

/** ******************************************************************************
*  (c) 2019 ZondaX GmbH
*
*  Licensed under the Apache License, Version 2.0 (the "License");
*  you may not use this file except in compliance with the License.
*  You may obtain a copy of the License at
*
*      http://www.apache.org/licenses/LICENSE-2.0
*
*  Unless required by applicable law or agreed to in writing, software
*  distributed under the License is distributed on an "AS IS" BASIS,
*  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*  See the License for the specific language governing permissions and
*  limitations under the License.
******************************************************************************* */
var defaultHrp = 'cosmos';

var CosmosDelegateTool = function CosmosDelegateTool() {
  // eslint-disable-next-line camelcase
  this.comm = _ledgerCosmosJs.comm_u2f;
  this.connected = false;
  this.lastError = 'No error';
  this.comm_timeout = 5000;
  this.transport_debug = true;
  this.resturl = 'https://stargate.cosmos.network';
};

CosmosDelegateTool.prototype.switchTransportToHID = function () {
  // eslint-disable-next-line camelcase
  this.comm = _ledgerCosmosJs.comm_node;
};

CosmosDelegateTool.prototype.switchTransportToU2F = function () {
  // eslint-disable-next-line camelcase
  this.comm = _ledgerCosmosJs.comm_u2f;
}; // Detect when a ledger device is connected and verify the cosmos app is running.


CosmosDelegateTool.prototype.connect =
/*#__PURE__*/
(0, _asyncToGenerator2["default"])(
/*#__PURE__*/
_regenerator["default"].mark(function _callee() {
  return _regenerator["default"].wrap(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          this.connected = true;
          _context.next = 3;
          return _ledgerCosmosJs.comm_node.create_async(this.comm_timeout, this.transport_debug).then(function (comm) {
            return new _ledgerCosmosJs.App(comm);
          });

        case 3:
          this.app = _context.sent;

        case 4:
        case "end":
          return _context.stop();
      }
    }
  }, _callee, this);
})); // Retrieve public key
// Retrieve cosmos bech32 address

CosmosDelegateTool.prototype.retrieveAddress =
/*#__PURE__*/
function () {
  var _ref2 = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee2(account, index) {
    var answer, path, pk;
    return _regenerator["default"].wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            // TODO: error if not connected
            answer = {};
            path = [44, 118, account, 0, index];
            _context2.next = 4;
            return this.app.publicKey(path);

          case 4:
            pk = _context2.sent;
            // TODO: Add error handling
            answer.pk = pk.compressed_pk.toString('hex');
            answer.path = path;
            answer.bech32 = _ledgerCosmosJs.Tools.getBech32FromPK(defaultHrp, pk.compressed_pk);
            return _context2.abrupt("return", answer);

          case 9:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));

  return function (_x, _x2) {
    return _ref2.apply(this, arguments);
  };
}(); // Scan multiple address in a derivation path range (44’/118’/X/0/Y)
// eslint-disable-next-line max-len


CosmosDelegateTool.prototype.scanAddresses =
/*#__PURE__*/
function () {
  var _ref3 = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee3(minAccount, maxAccount, minIndex, maxIndex) {
    var answer, account, index, tmp;
    return _regenerator["default"].wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            answer = [];
            account = minAccount;

          case 2:
            if (!(account < maxAccount + 1)) {
              _context3.next = 15;
              break;
            }

            index = minIndex;

          case 4:
            if (!(index < maxIndex + 1)) {
              _context3.next = 12;
              break;
            }

            _context3.next = 7;
            return this.retrieveAddress(account, index);

          case 7:
            tmp = _context3.sent;
            answer.push(tmp);

          case 9:
            index += 1;
            _context3.next = 4;
            break;

          case 12:
            account += 1;
            _context3.next = 2;
            break;

          case 15:
            return _context3.abrupt("return", answer);

          case 16:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3, this);
  }));

  return function (_x3, _x4, _x5, _x6) {
    return _ref3.apply(this, arguments);
  };
}(); // Retrieve atom balances from the network for a list of account
// Retrieve delegated/not-delegated balances for each account


CosmosDelegateTool.prototype.retrieveBalances =
/*#__PURE__*/
function () {
  var _ref4 = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee4(addressList) {
    var _this = this;

    var answer, url, validators, requestValidators, requestsBalance, requestsDelegations;
    return _regenerator["default"].wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            answer = []; // Get all validators
            // TODO: cache

            url = "".concat(this.resturl, "/staking/validators");
            validators = {};
            requestValidators = _axios["default"].get(url).then(function (r) {
              for (var i = 0; i < r.data.length; i += 1) {
                var valdata = {};
                var t = r.data[i];
                valdata.tokens = (0, _big["default"])(t.tokens);
                valdata.totalShares = (0, _big["default"])(t.delegator_shares);
                validators[t.operator_address] = valdata;
              }
            }, function (e) {
              // TODO: improve error handling
              console.log('Error', addr, e);
            });
            _context4.next = 6;
            return requestValidators;

          case 6:
            // Get all balances
            requestsBalance = addressList.map(function (addr, index) {
              var url = "".concat(_this.resturl, "/bank/balances/").concat(addr.bech32);
              return _axios["default"].get(url).then(function (r) {
                var balanceuAtom = (0, _big["default"])(0);

                for (var i = 0; i < r.data.length; i += 1) {
                  var t = r.data[i];

                  if (t.denom === 'uatom') {
                    balanceuAtom = (0, _big["default"])(t.amount).toString();
                    break;
                  }
                }

                addressList[index].balanceuAtom = balanceuAtom;
              }, function (e) {
                // TODO: improve error handling
                console.log('Error', addr, e);
              });
            }); // Get all delegations

            requestsDelegations = addressList.map(function (addr, index) {
              var url = "".concat(_this.resturl, "/staking/delegators/").concat(addr.bech32, "/delegations");
              return _axios["default"].get(url).then(function (r) {
                var delegationsuAtoms = {};
                var totalDelegation = (0, _big["default"])(0);

                for (var i = 0; i < r.data.length; i += 1) {
                  var t = r.data[i];
                  var valAddr = t.validator_address;

                  if (valAddr in validators) {
                    var shares = (0, _big["default"])(t.shares);
                    var valData = validators[valAddr];
                    var valTokens = valData.tokens;
                    var valTotalShares = valData.totalShares;
                    var tokens = shares.times(valTokens).div(valTotalShares);
                    delegationsuAtoms[valAddr] = tokens.toString();
                    totalDelegation = totalDelegation.add(tokens);
                  }
                }

                addressList[index].delegationsuAtoms = delegationsuAtoms;
                addressList[index].delegationsTotaluAtoms = totalDelegation.toString();
              }, function (e) {
                // TODO: improve error handling
                console.log('Error', addr, e);
              });
            });
            _context4.next = 10;
            return Promise.all(requestsBalance);

          case 10:
            _context4.next = 12;
            return Promise.all(requestsDelegations);

          case 12:
            console.log(addressList);
            return _context4.abrupt("return", answer);

          case 14:
          case "end":
            return _context4.stop();
        }
      }
    }, _callee4, this);
  }));

  return function (_x7) {
    return _ref4.apply(this, arguments);
  };
}(); // TODO: Create a delegate transaction
// TODO: Create a re-delegate transaction
// TODO: Create an undelegate transaction


CosmosDelegateTool.prototype.txCreate =
/*#__PURE__*/
(0, _asyncToGenerator2["default"])(
/*#__PURE__*/
_regenerator["default"].mark(function _callee5() {
  return _regenerator["default"].wrap(function _callee5$(_context5) {
    while (1) {
      switch (_context5.prev = _context5.next) {
        case 0:
          return _context5.abrupt("return", 'NA');

        case 1:
        case "end":
          return _context5.stop();
      }
    }
  }, _callee5);
})); // TODO: Sign any transaction in a ledger device

CosmosDelegateTool.prototype.txSign =
/*#__PURE__*/
function () {
  var _ref6 = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee6(tx) {
    return _regenerator["default"].wrap(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            return _context6.abrupt("return", 'NA');

          case 1:
          case "end":
            return _context6.stop();
        }
      }
    }, _callee6);
  }));

  return function (_x8) {
    return _ref6.apply(this, arguments);
  };
}(); // TODO: Submit/relay the transaction to a network node


CosmosDelegateTool.prototype.txSubmit =
/*#__PURE__*/
function () {
  var _ref7 = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee7(tx) {
    return _regenerator["default"].wrap(function _callee7$(_context7) {
      while (1) {
        switch (_context7.prev = _context7.next) {
          case 0:
            return _context7.abrupt("return", 'NA');

          case 1:
          case "end":
            return _context7.stop();
        }
      }
    }, _callee7);
  }));

  return function (_x9) {
    return _ref7.apply(this, arguments);
  };
}(); // TODO: Retrieve the state of a transaction hash


CosmosDelegateTool.prototype.txStatus =
/*#__PURE__*/
function () {
  var _ref8 = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee8(txHash) {
    return _regenerator["default"].wrap(function _callee8$(_context8) {
      while (1) {
        switch (_context8.prev = _context8.next) {
          case 0:
            return _context8.abrupt("return", 'NA');

          case 1:
          case "end":
            return _context8.stop();
        }
      }
    }, _callee8);
  }));

  return function (_x10) {
    return _ref8.apply(this, arguments);
  };
}();

module.exports = CosmosDelegateTool;