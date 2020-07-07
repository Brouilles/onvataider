/* eslint no-unused-expressions: 0 */
/* eslint no-param-reassign: 0 */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { TransitionGroup } from 'react-transition-group';
import { createPortal } from 'react-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTimes, faInfo, faCheck, faExclamationTriangle,
} from '@fortawesome/free-solid-svg-icons';

import Transition from './Transition';
import { Context } from './Context';

class Provider extends Component {
  static propTypes = {
    type: PropTypes.oneOf(['info', 'success', 'error']),
  }

  static defaultProps = {
    type: 'info',
  }

  state = {
    root: null,
    alerts: [],
  }

  timerId = []

  componentDidMount() {
    const root = document.createElement('div');
    document.body.appendChild(root);

    this.setState({ root });
  }

  componentWillUnmount() {
    this.timerId.forEach(clearTimeout);

    const { root } = this.state;
    if (root) document.body.removeChild(root);
  }

  show = (message = '', options = {}) => {
    const id = Math.random()
      .toString(36)
      .substr(2, 9);

    const { type } = this.props;
    const timeout = 6000;

    const alertOptions = {
      timeout,
      type,
      ...options,
    };

    const alert = {
      id,
      message,
      options: alertOptions,
    };

    alert.close = () => this.remove(alert);

    if (alert.options.timeout) {
      const timerId = setTimeout(() => {
        this.remove(alert);

        this.timerId.splice(this.timerId.indexOf(timerId), 1);
      }, alert.options.timeout);

      this.timerId.push(timerId);
    }

    this.setState(
      prevState => ({
        alerts: prevState.alerts.concat(alert),
      }),
      () => {
        alert.options.onOpen && alert.options.onOpen();
      },
    );

    return alert;
  }

  remove = (alert) => {
    this.setState((prevState) => {
      const lengthBeforeRemove = prevState.alerts.length;
      const alerts = prevState.alerts.filter(a => a.id !== alert.id);

      if (lengthBeforeRemove > alerts.length && alert.options.onClose) {
        alert.options.onClose();
      }

      return { alerts };
    });
  }

  render() {
    const { root, alerts } = this.state;

    const {
      children,
      timeout,
      type,
    } = this.props;

    const options = {
      timeout,
      type,
    };

    const alert = {
      ...this.state,
      show: this.show,
      remove: this.remove,
    };

    const AlertComponent = ({
      message, close, options,
    }) => (
      <AlertWrapper type={options.type}>
        <div>
          {options.type === 'info' && <FontAwesomeIcon icon={faInfo} />}
          {options.type === 'success' && <FontAwesomeIcon icon={faCheck} />}
          {options.type === 'error' && <FontAwesomeIcon icon={faExclamationTriangle} />}
        </div>

        <div style={{ flex: 2 }}>
          {message}
        </div>

        <div role="button" onClick={close}>
          <FontAwesomeIcon icon={faTimes} />
        </div>
      </AlertWrapper>
    );

    return (
      <Context.Provider value={alert}>
        {children}
        {root
          && createPortal(
            <Wrapper options={options}>
              <TransitionGroup>
                {alerts.map(element => (
                  <Transition type="fade" key={element.id}>
                    <AlertComponent
                      {...element}
                    />
                  </Transition>
                ))}
              </TransitionGroup>
            </Wrapper>,
            root,
          )}
      </Context.Provider>
    );
  }
}

export default Provider;

const Wrapper = styled.div`
  position: fixed;
  top: 66px;
  right: auto;
  bottom: auto;
  left: 50%;
  transform: translate(-50%, 0%);
  z-index: 1051;

  width: 90%;
  max-width: 360px;
`;

const AlertWrapper = styled.div`
  display: grid;
  grid-template-columns: 30px 1fr 24px;
  box-shadow: rgba(0, 0, 0, 0.176) 0px 3px 8px;
  margin-bottom: 16px;

  overflow: hidden;
  transform: translate3d(0px, 0px, 0px);
  border-radius: 4px;
  transition: transform 220ms cubic-bezier(0.2, 0, 0, 1) 0s;

  div { padding-top: 8px; padding-bottom: 8px; }
  div:nth-child(1) { text-align: center; color: white; }
  div:nth-child(2) { font-size: 14px; line-height: 1.4; padding: 12px 8px 12px 8px; }
  div:nth-child(3) { cursor: pointer; }

  /* Type */
  ${props => props.type === 'info' && (`
    div:nth-child(1) { background-color: #004085; }
    background-color: #cce5ff;
    color: #004085;
  `)}

  ${props => props.type === 'success' && (`
    div:nth-child(1) { background-color: rgb(54, 179, 126); }
    background-color: rgb(227, 252, 239);
    color: rgb(0, 102, 68);
  `)}

  ${props => props.type === 'error' && (`
    div:nth-child(1) { background-color: red; }
    background-color: rgb(255, 235, 230);
    color: rgb(191, 38, 0);
  `)}
`;
