import React, { Component } from 'react';
import { Meteor } from 'meteor/meteor';
import {
  Collapse,
  Navbar,
  NavbarToggler,
  NavbarBrand,
  Nav,
  NavItem,
  NavLink,
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
} from 'reactstrap';
import { Link, NavLink as RRNavLink } from 'react-router-dom';
import styled from 'styled-components';

import { UserContext } from '../../userContext';

export default class NavbarComponent extends Component {
  state = {
    isOpen: false,
  }

  toggle = () => {
    const { isOpen } = this.state;
    const width = window.innerWidth
    || document.documentElement.clientWidth
    || document.body.clientWidth;

    if (width <= 767) {
      this.setState({
        isOpen: !isOpen,
      });
    }
  }

  logout = () => {
    Meteor.logout();
  }

  render() {
    const { isOpen } = this.state;

    return (
      <CustomNavbar id="top-navbar" color="white" fixed="top" light expand="md">
        <NavbarBrand tag={Link} to="/">
          <img src="/logo/logo.png" alt="logo Onvataider.com" height="36" />
        </NavbarBrand>
        <NavbarToggler onClick={this.toggle} />
        <Collapse isOpen={isOpen} navbar>
          <Nav className="ml-auto" navbar>
            <NavItem>
              <NavLink onClick={this.toggle} to="/" activeClassName="active" tag={RRNavLink}>Accueil</NavLink>
            </NavItem>
            <NavItem>
              <NavLink onClick={this.toggle} to="/projets" activeClassName="active" tag={RRNavLink}>Projets</NavLink>
            </NavItem>
            <NavItem>
              <NavLink onClick={this.toggle} to="/collectes" activeClassName="active" tag={RRNavLink}>Collectes solidaires</NavLink>
            </NavItem>
            <NavItem>
              <NavLink onClick={this.toggle} to="/produits" activeClassName="active" tag={RRNavLink}>Ventes solidaires</NavLink>
            </NavItem>
            <NavItem>
              <NavLink onClick={this.toggle} to="/nouveau-projet" activeClassName="active" tag={RRNavLink}>Créer un projet / collecte</NavLink>
            </NavItem>

            <UserContext.Consumer>
              {(context) => {
                if (context.id != null) {
                  return (
                    <React.Fragment>
                      <UncontrolledDropdown nav inNavbar>
                        <DropdownToggle nav caret>
                          {context.name}
                        </DropdownToggle>
                        <DropdownMenu right>
                          <DropdownItem onClick={this.toggle} to="/tableau-de-bord" tag={RRNavLink}>
                            Tableau de bord
                          </DropdownItem>
                          <DropdownItem onClick={this.toggle} to="/compte" tag={RRNavLink}>
                            Mon compte
                          </DropdownItem>

                          {context.roles && context.roles.indexOf('administrator') > -1
                            && (
                            <React.Fragment>
                              <DropdownItem divider />
                              <DropdownItem onClick={this.toggle} to="/administration/comptes" tag={RRNavLink}>
                                Gestion des comptes
                              </DropdownItem>
                              <DropdownItem onClick={this.toggle} to="/administration/projets" tag={RRNavLink}>
                                Gestion des projets
                              </DropdownItem>
                              <DropdownItem onClick={this.toggle} to="/administration/categories-produits" tag={RRNavLink}>
                                Gestion des catégories des produits
                              </DropdownItem>
                              <DropdownItem onClick={this.toggle} to="/administration/produits" tag={RRNavLink}>
                                Gestion des produits
                              </DropdownItem>
                              <DropdownItem onClick={this.toggle} to="/administration/categories" tag={RRNavLink}>
                                Gestion des catégories
                              </DropdownItem>
                              <DropdownItem onClick={this.toggle} to="/administration/pages" tag={RRNavLink}>
                                Gestion des pages
                              </DropdownItem>
                            </React.Fragment>
)
                          }

                          <DropdownItem divider />
                          <DropdownItem onClick={this.logout}>
                            Déconnexion
                          </DropdownItem>
                        </DropdownMenu>
                      </UncontrolledDropdown>
                    </React.Fragment>
                  );
                }
              }}
            </UserContext.Consumer>
          </Nav>

          <UserContext.Consumer>
            {(context) => {
              if (!context.id) { return (<Link to="/connexion" onClick={this.toggle} className="btn btn-outline-primary">Connexion</Link>); }
            }}
          </UserContext.Consumer>
        </Collapse>
      </CustomNavbar>
    );
  }
}

const CustomNavbar = styled(Navbar)`
    box-shadow: 0 .25rem .75rem rgba(0, 0, 0, .05);

    .btn-outline-primary {
        margin-left: 16px;
        color: #007bff !important;

        &:hover {
            color: white !important;
        }
    }
`;
