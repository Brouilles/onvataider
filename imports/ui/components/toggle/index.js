import { Component } from 'react';
import PropTypes from 'prop-types';

export default class Toggle extends Component {
    static propTypes = {
      children: PropTypes.func.isRequired,
    }

    state = {
      on: false,
    }

    toggle = () => {
      const { on } = this.state;
      this.setState({
        on: !on,
      });
    }

    render() {
      const { children } = this.props;
      const { on } = this.state;
      return children({
        on,
        toggle: this.toggle,
      });
    }
}
